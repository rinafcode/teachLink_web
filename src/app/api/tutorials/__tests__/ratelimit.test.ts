import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  slidingWindowRateLimit,
  getClientIP,
  createRateLimitResponse,
  withRateLimit,
  RATE_LIMIT_TIERS,
  checkIdentityRateLimit,
  resetIdentityRateLimit,
} from '@/lib/ratelimit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A trusted proxy used throughout so header-derived client IPs are honored.
// Without a configured allowlist getClientIP ignores forwarded headers.
const TRUSTED_PROXY = '10.0.0.1';

function makeRequest(ip = '1.2.3.4'): Request {
  return new Request('https://example.com/api/tutorials', {
    headers: { 'x-forwarded-for': ip, 'cf-connecting-ip': TRUSTED_PROXY },
  });
}

// ---------------------------------------------------------------------------
// slidingWindowRateLimit
// ---------------------------------------------------------------------------

describe('slidingWindowRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const config = { limit: 3, windowMs: 60_000 };
    const id = `test-read-${Date.now()}`;

    const r1 = slidingWindowRateLimit(id, config);
    const r2 = slidingWindowRateLimit(id, config);
    const r3 = slidingWindowRateLimit(id, config);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks the request that exceeds the limit', () => {
    const config = { limit: 2, windowMs: 60_000 };
    const id = `test-block-${Date.now()}`;

    slidingWindowRateLimit(id, config);
    slidingWindowRateLimit(id, config);
    const blocked = slidingWindowRateLimit(id, config);

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets the window after windowMs elapses', () => {
    const config = { limit: 1, windowMs: 60_000 };
    const id = `test-reset-${Date.now()}`;

    slidingWindowRateLimit(id, config);
    const blocked = slidingWindowRateLimit(id, config);
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(60_001);

    const allowed = slidingWindowRateLimit(id, config);
    expect(allowed.success).toBe(true);
  });

  it('returns correct remaining count', () => {
    const config = { limit: 5, windowMs: 60_000 };
    const id = `test-remaining-${Date.now()}`;

    const r1 = slidingWindowRateLimit(id, config);
    expect(r1.remaining).toBe(4);

    const r2 = slidingWindowRateLimit(id, config);
    expect(r2.remaining).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// RATE_LIMIT_TIERS — tutorial routes use READ and WRITE tiers
// ---------------------------------------------------------------------------

describe('RATE_LIMIT_TIERS', () => {
  it('READ tier allows 60 requests per minute', () => {
    expect(RATE_LIMIT_TIERS.READ.limit).toBe(60);
    expect(RATE_LIMIT_TIERS.READ.windowMs).toBe(60_000);
  });

  it('WRITE tier allows 30 requests per minute', () => {
    expect(RATE_LIMIT_TIERS.WRITE.limit).toBe(30);
    expect(RATE_LIMIT_TIERS.WRITE.windowMs).toBe(60_000);
  });

  it('WRITE tier is stricter than READ tier', () => {
    expect(RATE_LIMIT_TIERS.WRITE.limit).toBeLessThan(RATE_LIMIT_TIERS.READ.limit);
  });
});

// ---------------------------------------------------------------------------
// getClientIP
// ---------------------------------------------------------------------------

describe('getClientIP', () => {
  const original = process.env.TRUSTED_PROXY_IPS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TRUSTED_PROXY_IPS;
    } else {
      process.env.TRUSTED_PROXY_IPS = original;
    }
  });

  it('extracts IP from x-forwarded-for header when connection is from a trusted proxy', () => {
    process.env.TRUSTED_PROXY_IPS = TRUSTED_PROXY;
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1', 'cf-connecting-ip': TRUSTED_PROXY },
    });
    expect(getClientIP(req)).toBe('203.0.113.1');
  });

  it('ignores x-forwarded-for when no trusted proxy is configured (spoofing prevention)', () => {
    // Legacy deployments that never configure TRUSTED_PROXY_IPS must not trust
    // the header, otherwise a client could spoof its IP to bypass rate limits.
    delete process.env.TRUSTED_PROXY_IPS;
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.2' },
    });
    expect(getClientIP(req)).toBe('127.0.0.1');
  });

  it('returns 127.0.0.1 when no IP header is present', () => {
    process.env.TRUSTED_PROXY_IPS = TRUSTED_PROXY;
    const req = new Request('https://example.com');
    expect(getClientIP(req)).toBe('127.0.0.1');
  });
});

// ---------------------------------------------------------------------------
// createRateLimitResponse
// ---------------------------------------------------------------------------

describe('createRateLimitResponse', () => {
  it('returns null when the request is allowed', () => {
    const result = { success: true, remaining: 59, reset: Date.now() + 60_000, limit: 60 };
    expect(createRateLimitResponse(result)).toBeNull();
  });

  it('returns a 429 response when the request is blocked', () => {
    const result = {
      success: false,
      remaining: 0,
      reset: Date.now() + 30_000,
      limit: 60,
      retryAfter: 30,
    };
    const response = createRateLimitResponse(result);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('Retry-After')).toBe('30');
    expect(response!.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// withRateLimit — integration with tutorial route tiers
// ---------------------------------------------------------------------------

describe('withRateLimit', () => {
  const original = process.env.TRUSTED_PROXY_IPS;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.TRUSTED_PROXY_IPS = TRUSTED_PROXY;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (original === undefined) {
      delete process.env.TRUSTED_PROXY_IPS;
    } else {
      process.env.TRUSTED_PROXY_IPS = original;
    }
  });

  it('allows a GET /tutorials request under READ limit', () => {
    const req = makeRequest('10.0.0.1');
    const { rateLimitResponse } = withRateLimit(req, 'READ');
    expect(rateLimitResponse).toBeNull();
  });

  it('allows a POST /tutorials request under WRITE limit', () => {
    const req = makeRequest('10.0.0.2');
    const { rateLimitResponse } = withRateLimit(req, 'WRITE');
    expect(rateLimitResponse).toBeNull();
  });

  it('blocks after exceeding READ limit (60 req/min)', () => {
    const ip = '10.0.0.3';
    // Exhaust the READ limit
    for (let i = 0; i < 60; i++) {
      withRateLimit(makeRequest(ip), 'READ');
    }
    const { rateLimitResponse } = withRateLimit(makeRequest(ip), 'READ');
    expect(rateLimitResponse).not.toBeNull();
    expect(rateLimitResponse!.status).toBe(429);
  });

  it('blocks after exceeding WRITE limit (30 req/min)', () => {
    const ip = '10.0.0.4';
    for (let i = 0; i < 30; i++) {
      withRateLimit(makeRequest(ip), 'WRITE');
    }
    const { rateLimitResponse } = withRateLimit(makeRequest(ip), 'WRITE');
    expect(rateLimitResponse).not.toBeNull();
    expect(rateLimitResponse!.status).toBe(429);
  });

  it('addHeaders injects rate limit headers on a successful response', () => {
    const req = makeRequest('10.0.0.5');
    const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
    expect(rateLimitResponse).toBeNull();

    const base = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const response = addHeaders(base);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).not.toBeNull();
    expect(response.headers.get('X-RateLimit-Reset')).not.toBeNull();
  });

  it('READ and WRITE limits are tracked independently per IP', () => {
    const ip = '10.0.0.6';
    // Exhaust WRITE limit
    for (let i = 0; i < 30; i++) {
      withRateLimit(makeRequest(ip), 'WRITE');
    }
    const writeBlocked = withRateLimit(makeRequest(ip), 'WRITE');
    expect(writeBlocked.rateLimitResponse?.status).toBe(429);

    // READ limit for the same IP should still be open
    const readAllowed = withRateLimit(makeRequest(ip), 'READ');
    expect(readAllowed.rateLimitResponse).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkIdentityRateLimit — per-identity (email) rate limiting
// ---------------------------------------------------------------------------
describe('checkIdentityRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the LOGIN_IDENTITY limit', () => {
    const email = `test-${Date.now()}@example.com`;

    const r1 = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    const r2 = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    const r3 = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');

    expect(r1.rateLimitResponse).toBeNull();
    expect(r2.rateLimitResponse).toBeNull();
    expect(r3.rateLimitResponse).toBeNull();
    expect(r3.result.remaining).toBe(2);
  });

  it('blocks after exceeding the LOGIN_IDENTITY limit (5 attempts / 15 min)', () => {
    const email = `blocked-${Date.now()}@example.com`;

    for (let i = 0; i < 5; i++) {
      const r = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
      expect(r.rateLimitResponse).toBeNull();
    }

    const blocked = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(blocked.rateLimitResponse).not.toBeNull();
    expect(blocked.rateLimitResponse!.status).toBe(429);
    expect(blocked.result.success).toBe(false);
    expect(blocked.result.retryAfter).toBeGreaterThan(0);
  });

  it('resets the window after resetIdentityRateLimit is called', () => {
    const email = `reset-${Date.now()}@example.com`;

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    }
    const blocked = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(blocked.rateLimitResponse).not.toBeNull();

    // Reset (simulates successful login)
    resetIdentityRateLimit(email, 'LOGIN_IDENTITY');

    const allowed = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(allowed.rateLimitResponse).toBeNull();
    expect(allowed.result.remaining).toBe(4);
  });

  it('tracks different identities independently', () => {
    const email1 = `user1-${Date.now()}@example.com`;
    const email2 = `user2-${Date.now()}@example.com`;

    // Exhaust limit for email1
    for (let i = 0; i < 5; i++) {
      checkIdentityRateLimit(email1, 'LOGIN_IDENTITY');
    }
    const blocked1 = checkIdentityRateLimit(email1, 'LOGIN_IDENTITY');
    expect(blocked1.rateLimitResponse).not.toBeNull();

    // email2 should still be allowed
    const allowed2 = checkIdentityRateLimit(email2, 'LOGIN_IDENTITY');
    expect(allowed2.rateLimitResponse).toBeNull();
  });

  it('returns correct remaining count', () => {
    const email = `remaining-${Date.now()}@example.com`;

    const r1 = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(r1.result.remaining).toBe(4);

    const r2 = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(r2.result.remaining).toBe(3);
  });

  it('resets the window after the sliding window expires', () => {
    const email = `expire-${Date.now()}@example.com`;
    const windowMs = RATE_LIMIT_TIERS.LOGIN_IDENTITY.windowMs;

    for (let i = 0; i < 5; i++) {
      checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    }
    const blocked = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(blocked.rateLimitResponse).not.toBeNull();

    vi.advanceTimersByTime(windowMs + 1);

    const allowed = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
    expect(allowed.rateLimitResponse).toBeNull();
  });
});
