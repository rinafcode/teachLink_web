/**
 * In-memory sliding window rate limiter for API routes.
 * Provides IP-based rate limiting with configurable limits and windows.
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

const stores = new Map<string, RateLimitEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of stores.entries()) {
    if (entry.resetAt <= now) {
      stores.delete(key);
    }
  }
}

setInterval(cleanup, 60_000);

export function slidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = stores.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    stores.set(identifier, { count: 1, resetAt });
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

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetAt,
    limit: config.limit,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0]?.trim();
    if (firstIP) return firstIP;
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

export const RATE_LIMIT_TIERS = {
  AUTH: { limit: 5, windowMs: 60_000 },
  WRITE: { limit: 30, windowMs: 60_000 },
  READ: { limit: 60, windowMs: 60_000 },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

export function createRateLimitResponse(result: RateLimitResult): Response | null {
  if (result.success) {
    return null;
  }

  const retryAfter = result.retryAfter ?? Math.ceil((result.reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: {
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
        'Retry-After': String(retryAfter),
      },
    },
  );
}

export function withRateLimit<T extends Request>(
  request: T,
  tier: RateLimitTier,
): { addHeaders: (response: Response) => Response; rateLimitResponse: Response | null } {
  const ip = getClientIP(request);
  const config = RATE_LIMIT_TIERS[tier];
  const identifier = `${ip}:${tier}`;
  const result = slidingWindowRateLimit(identifier, config);

  const addHeaders = (response: Response): Response => {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(result.limit));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));
    return new Response(response.body, {
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
