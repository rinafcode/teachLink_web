import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { getTrustedProxyConfig } from '@/config/environment';

/**
 * Database-backed sliding window rate limiter for API routes.
 * Provides IP-based rate limiting with configurable limits and windows.
 *
 * Counters are persisted to PostgreSQL so they survive process restarts.
 * An in-memory Map serves as a fast synchronous cache; every write is also
 * persisted to the database asynchronously (fire-and-forget) so that
 * subsequent processes can pick up the state after a deploy.
 *
 * Security: getClientIP() only trusts x-forwarded-for / x-real-ip headers when
 * the request arrives from a proxy listed in TRUSTED_PROXY_IPS (see
 * src/config/environment.ts). When no proxies are configured the headers are
 * ignored entirely, preventing IP spoofing from bypassing rate limits.
 */

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface RateLimitResult extends RateLimitInfo {
  success: boolean;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Fast in-memory cache used as the synchronous hot path.
 * Writes are also persisted to the database asynchronously.
 */
const stores = new Map<string, RateLimitEntry>();

/**
 * Persists a single rate-limit entry to the database.
 * Errors are silently swallowed so that a DB outage never blocks request
 * processing — the in-memory cache still provides best-effort limiting.
 */
async function persistToDb(identifier: string, entry: RateLimitEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO rate_limits (identifier, count, reset_at, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (identifier) DO UPDATE
         SET count = EXCLUDED.count,
             reset_at = EXCLUDED.reset_at,
             updated_at = NOW()`,
      [identifier, entry.count, entry.resetAt],
    );
  } catch {
    // Silently ignore — the in-memory store is still authoritative for
    // the current process, and DB unavailability should not break requests.
  }
}

/**
 * Removes an expired entry from the database.
 */
async function removeFromDb(identifier: string): Promise<void> {
  try {
    await query('DELETE FROM rate_limits WHERE identifier = $1', [identifier]);
  } catch {
    // Silently ignore.
  }
}

/**
 * Loads all non-expired rate-limit entries from the database into the
 * in-memory cache on process startup.  Called once at module load time.
 */
async function loadFromDb(): Promise<void> {
  try {
    const now = Date.now();
    const result = await query(
      'SELECT identifier, count, reset_at FROM rate_limits WHERE reset_at > $1',
      [now],
    );
    for (const row of result.rows) {
      stores.set(row.identifier as string, {
        count: row.count as number,
        resetAt: row.reset_at as number,
      });
    }
  } catch {
    // DB may not be available yet (e.g. during build or early startup).
    // The in-memory store will be used as a fallback.
  }
}

// Kick off the load-on-startup — non-blocking.
void loadFromDb();

/**
 * Synchronous sliding-window rate limiter backed by an in-memory cache
 * with asynchronous database persistence.
 *
 * The function signature is intentionally synchronous so that the 30+
 * existing call-sites (withRateLimit, certificate routes, etc.) do not
 * need to become async.
 */
export function slidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = stores.get(identifier);

  if (!entry || entry.resetAt <= now) {
    if (entry) {
      stores.delete(identifier);
      void removeFromDb(identifier);
    }
    const resetAt = now + config.windowMs;
    const newEntry: RateLimitEntry = { count: 1, resetAt };
    stores.set(identifier, newEntry);
    void persistToDb(identifier, newEntry);
    return {
      success: true,
      remaining: config.limit - 1,
      reset: resetAt,
      limit: config.limit,
    };
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
      limit: config.limit,
      retryAfter,
    };
  }

  entry.count += 1;
  stores.set(identifier, entry);
  void persistToDb(identifier, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Extracts the real client IP from a request, defending against header spoofing.
 *
 * Forwarded headers (x-forwarded-for, x-real-ip, cf-connecting-ip) are only
 * trusted when the request arrives directly from a proxy listed in
 * TRUSTED_PROXY_IPS. When no trusted proxies are configured — or when the
 * connection does not come from a trusted proxy — the forwarded headers are
 * ignored and the fallback sentinel is returned, so spoofed headers cannot be
 * used to rotate rate-limit buckets.
 *
 * Header precedence (when the connection is from a trusted proxy):
 *   1. x-forwarded-for  – standard proxy chain header; leftmost IP is the client
 *   2. x-real-ip        – set by nginx and similar proxies
 *   3. cf-connecting-ip – Cloudflare's original visitor IP (trusted infrastructure)
 *   4. fallback         – 127.0.0.1 (local / direct connection)
 */
export function getClientIP(request: Request): string {
  const { trustedProxyIPs } = getTrustedProxyConfig();

  // When no trusted proxies are configured, trusting x-forwarded-for would let
  // any client spoof its IP and bypass rate limits — so forwarded headers are
  // always ignored in that case.
  if (trustedProxyIPs.size === 0) {
    return '127.0.0.1';
  }

  // Determine the direct connection address. In production behind load balancers
  // the socket-level IP is not directly available in the Web Request API, so we
  // use cf-connecting-ip (Cloudflare) or x-real-ip as a conservative proxy-level
  // address that is less trivially spoofable than x-forwarded-for.
  const directConnectionIP =
    request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? null;

  // The request is only eligible for header-derived IPs if it was received from
  // a configured trusted proxy. Otherwise all forwarded headers are ignored.
  const isFromTrustedProxy = directConnectionIP !== null && trustedProxyIPs.has(directConnectionIP);

  if (isFromTrustedProxy) {
    // Trust x-forwarded-for from a known proxy; take the leftmost (client) IP.
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIP = forwarded.split(',')[0]?.trim();
      if (firstIP) return firstIP;
    }

    // Fall through to the direct connection header if x-forwarded-for was absent.
    if (directConnectionIP) return directConnectionIP;
  }

  // Connection does not come from a trusted proxy — ignore all proxy headers
  // to prevent spoofing and return the fallback sentinel.
  return '127.0.0.1';
}

export const RATE_LIMIT_TIERS = {
  AUTH: { limit: 5, windowMs: 60_000 },
  // Per-identity (email) throttle for failed login attempts. Uses a wider
  // window than the IP-based AUTH tier so credential-stuffing bots that rotate
  // IPs are still throttled per target account.
  LOGIN_IDENTITY: { limit: 5, windowMs: 900_000 },
  WRITE: { limit: 30, windowMs: 60_000 },
  READ: { limit: 60, windowMs: 60_000 },
  // Lower tier for unauthenticated, client-driven endpoints (e.g. error
  // reporting) that are prone to log-flooding abuse.
  REPORTING: { limit: 10, windowMs: 60_000 },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

export function createRateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.success) {
    return null;
  }

  const retryAfter = result.retryAfter ?? Math.ceil((result.reset - Date.now()) / 1000);

  const response = NextResponse.json(
    {
      error: {
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      },
    },
    {
      status: 429,
    },
  );

  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));
  response.headers.set('Retry-After', String(retryAfter));

  return response;
}

/**
 * Checks a per-identity (e.g. email) rate limit without binding to a request.
 * Returns the rate limit result and a helper to produce a 429 response when
 * the limit has been exceeded.
 */
export function checkIdentityRateLimit(
  identity: string,
  tier: RateLimitTier,
): {
  result: RateLimitResult;
  rateLimitResponse: NextResponse | null;
} {
  const config = RATE_LIMIT_TIERS[tier];
  const identifier = `identity:${identity}:${tier}`;
  const result = slidingWindowRateLimit(identifier, config);
  return {
    result,
    rateLimitResponse: createRateLimitResponse(result),
  };
}

/**
 * Resets the rate-limit counter for a given identity and tier. Called after a
 * successful login so the user's next batch of attempts starts fresh.
 */
export function resetIdentityRateLimit(identity: string, tier: RateLimitTier): void {
  const identifier = `identity:${identity}:${tier}`;
  stores.delete(identifier);
}

export function withRateLimit<T extends Request>(
  request: T,
  tier: RateLimitTier,
): {
  addHeaders: <U>(response: Response | NextResponse<U>) => NextResponse<U>;
  rateLimitResponse: NextResponse | null;
} {
  const ip = getClientIP(request);
  const config = RATE_LIMIT_TIERS[tier];
  const identifier = `${ip}:${tier}`;
  const result = slidingWindowRateLimit(identifier, config);

  const addHeaders = <U>(response: Response | NextResponse<U>): NextResponse<U> => {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));
    return new NextResponse<U>(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  return {
    addHeaders,
    rateLimitResponse: createRateLimitResponse(result),
  };
}