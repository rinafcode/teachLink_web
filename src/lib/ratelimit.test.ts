/**
 * Tests for src/lib/ratelimit.ts
 *
 * Coverage:
 * - parseTrustedProxyIPs() – parses the env var correctly
 * - getClientIP() – trusted proxy, untrusted proxy, and no-proxy scenarios
 * - Spoofing prevention – forged x-forwarded-for from untrusted sources
 * - slidingWindowRateLimit() – basic window behaviour
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseTrustedProxyIPs, slidingWindowRateLimit } from './ratelimit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Request with only the headers we care about.
 */
function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', { headers });
}

/**
 * Import getClientIP with a specific TRUSTED_PROXY_IPS value injected via
 * process.env. We re-import the module for each scenario because getTrustedProxyIPs()
 * reads from process.env at call time, so we just set the env var before calling.
 */
async function getClientIPWith(
  trustedProxyIPs: string | undefined,
  headers: Record<string, string>,
): Promise<string> {
  const original = process.env.TRUSTED_PROXY_IPS;
  if (trustedProxyIPs === undefined) {
    delete process.env.TRUSTED_PROXY_IPS;
  } else {
    process.env.TRUSTED_PROXY_IPS = trustedProxyIPs;
  }

  try {
    // Dynamic import forces a fresh module eval per test via vitest module cache
    // invalidation. Since vitest caches modules we use the direct import and
    // rely on getTrustedProxyIPs() reading process.env at call time.
    const { getClientIP } = await import('./ratelimit');
    return getClientIP(makeRequest(headers));
  } finally {
    if (original === undefined) {
      delete process.env.TRUSTED_PROXY_IPS;
    } else {
      process.env.TRUSTED_PROXY_IPS = original;
    }
  }
}

// ---------------------------------------------------------------------------
// parseTrustedProxyIPs
// ---------------------------------------------------------------------------

describe('parseTrustedProxyIPs()', () => {
  it('returns an empty Set for undefined input', () => {
    expect(parseTrustedProxyIPs(undefined).size).toBe(0);
  });

  it('returns an empty Set for an empty string', () => {
    expect(parseTrustedProxyIPs('').size).toBe(0);
  });

  it('returns an empty Set for a whitespace-only string', () => {
    expect(parseTrustedProxyIPs('   ').size).toBe(0);
  });

  it('parses a single IP', () => {
    const result = parseTrustedProxyIPs('10.0.0.1');
    expect(result.size).toBe(1);
    expect(result.has('10.0.0.1')).toBe(true);
  });

  it('parses multiple comma-separated IPs', () => {
    const result = parseTrustedProxyIPs('10.0.0.1,10.0.0.2,172.16.0.1');
    expect(result.size).toBe(3);
    expect(result.has('10.0.0.1')).toBe(true);
    expect(result.has('10.0.0.2')).toBe(true);
    expect(result.has('172.16.0.1')).toBe(true);
  });

  it('trims whitespace around each IP', () => {
    const result = parseTrustedProxyIPs('  10.0.0.1 , 10.0.0.2  ');
    expect(result.has('10.0.0.1')).toBe(true);
    expect(result.has('10.0.0.2')).toBe(true);
  });

  it('ignores empty segments from trailing commas', () => {
    const result = parseTrustedProxyIPs('10.0.0.1,');
    expect(result.size).toBe(1);
    expect(result.has('10.0.0.1')).toBe(true);
  });

  it('handles IPv6 addresses', () => {
    const result = parseTrustedProxyIPs('::1,fe80::1');
    expect(result.has('::1')).toBe(true);
    expect(result.has('fe80::1')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getClientIP() — trusted proxy scenarios
// ---------------------------------------------------------------------------

describe('getClientIP() — trusted proxy', () => {
  it('returns the leftmost x-forwarded-for IP when connection is from a trusted proxy (via cf-connecting-ip)', async () => {
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '10.0.0.1',
      'x-forwarded-for': '203.0.113.5, 10.0.0.1',
    });
    expect(ip).toBe('203.0.113.5');
  });

  it('returns the leftmost x-forwarded-for IP when connection is from a trusted proxy (via x-real-ip)', async () => {
    const ip = await getClientIPWith('10.0.0.2', {
      'x-real-ip': '10.0.0.2',
      'x-forwarded-for': '198.51.100.7, 10.0.0.2',
    });
    expect(ip).toBe('198.51.100.7');
  });

  it('returns the x-real-ip when trusted proxy sets it but no x-forwarded-for is present', async () => {
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '10.0.0.1',
      // No x-forwarded-for — falls through to directConnectionIP
    });
    expect(ip).toBe('10.0.0.1');
  });

  it('handles a chain of proxies and returns the first (client) IP', async () => {
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '10.0.0.1',
      'x-forwarded-for': '203.0.113.1, 192.168.1.1, 10.0.0.1',
    });
    expect(ip).toBe('203.0.113.1');
  });

  it('trims whitespace from the extracted forwarded IP', async () => {
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '10.0.0.1',
      'x-forwarded-for': '  203.0.113.9  , 10.0.0.1',
    });
    expect(ip).toBe('203.0.113.9');
  });
});

// ---------------------------------------------------------------------------
// getClientIP() — untrusted proxy / spoofing prevention
// ---------------------------------------------------------------------------

describe('getClientIP() — spoofing prevention', () => {
  it('ignores x-forwarded-for when connection IP is NOT in TRUSTED_PROXY_IPS', async () => {
    // The "direct" connection comes from 1.2.3.4 (untrusted), but the attacker
    // injects a fake x-forwarded-for pretending to come from a privileged IP
    // (203.0.113.200) to try to get a different rate-limit bucket.
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '1.2.3.4', // NOT in trusted list
      'x-forwarded-for': '203.0.113.200',
    });
    // Should NOT return the spoofed value — it must be blocked by the fallback.
    expect(ip).not.toBe('203.0.113.200');
    // Correct behaviour: untrusted sources fall back to the sentinel.
    expect(ip).toBe('127.0.0.1');
  });

  it('rate-limits a spoofed request by the real connection IP, not the forged header', async () => {
    // Attacker sends x-forwarded-for: 999.999.999.999 (fake) from connection 5.5.5.5
    // With trusted proxy 10.0.0.1 configured, 5.5.5.5 is untrusted.
    const ip = await getClientIPWith('10.0.0.1', {
      'cf-connecting-ip': '5.5.5.5',
      'x-forwarded-for': '999.999.999.999',
    });
    expect(ip).toBe('127.0.0.1'); // untrusted fallback
    expect(ip).not.toBe('999.999.999.999');
  });

  it('returns 127.0.0.1 fallback when trusted proxies are set but no connection header is present', async () => {
    const ip = await getClientIPWith('10.0.0.1', {
      // No cf-connecting-ip, no x-real-ip — can't identify connection source
      'x-forwarded-for': '203.0.113.1',
    });
    // Without an identifiable proxy source we cannot trust the forwarded header
    expect(ip).toBe('127.0.0.1');
  });

  it('different spoofed x-forwarded-for values all map to the same rate-limit key (127.0.0.1)', async () => {
    // An attacker rotating fake IPs should all hit the same bucket.
    // We call sequentially to avoid process.env race conditions across concurrent tests.
    const fakeIPs = ['10.10.10.1', '10.10.10.2', '10.10.10.3'];
    const resolvedIPs: string[] = [];
    for (const fakeIP of fakeIPs) {
      const ip = await getClientIPWith('10.0.0.1', {
        'cf-connecting-ip': '9.9.9.9', // untrusted
        'x-forwarded-for': fakeIP,
      });
      resolvedIPs.push(ip);
    }
    // All should resolve to the same fallback — the attacker cannot rotate buckets.
    expect(new Set(resolvedIPs).size).toBe(1);
    expect(resolvedIPs[0]).toBe('127.0.0.1');
  });
});

// ---------------------------------------------------------------------------
// getClientIP() — no proxy configured (backwards compatibility)
// ---------------------------------------------------------------------------

describe('getClientIP() — no TRUSTED_PROXY_IPS configured', () => {
  it('reads x-forwarded-for when no proxy config exists (legacy behaviour)', async () => {
    const ip = await getClientIPWith(undefined, {
      'x-forwarded-for': '203.0.113.42',
    });
    expect(ip).toBe('203.0.113.42');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent and no proxy configured', async () => {
    const ip = await getClientIPWith(undefined, {
      'x-real-ip': '203.0.113.99',
    });
    expect(ip).toBe('203.0.113.99');
  });

  it('falls back to 127.0.0.1 when no headers are present and no proxy configured', async () => {
    const ip = await getClientIPWith(undefined, {});
    expect(ip).toBe('127.0.0.1');
  });
});

// ---------------------------------------------------------------------------
// slidingWindowRateLimit()
// ---------------------------------------------------------------------------

describe('slidingWindowRateLimit()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request within the limit', () => {
    const result = slidingWindowRateLimit('test-ip-1:READ', { limit: 3, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('decrements remaining on each subsequent request', () => {
    const config = { limit: 3, windowMs: 60_000 };
    slidingWindowRateLimit('test-ip-2:READ', config);
    const second = slidingWindowRateLimit('test-ip-2:READ', config);
    expect(second.remaining).toBe(1);
  });

  it('blocks when the limit is reached', () => {
    const config = { limit: 2, windowMs: 60_000 };
    slidingWindowRateLimit('test-ip-3:READ', config);
    slidingWindowRateLimit('test-ip-3:READ', config);
    const blocked = slidingWindowRateLimit('test-ip-3:READ', config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets after the window expires', () => {
    const config = { limit: 1, windowMs: 1_000 };
    slidingWindowRateLimit('test-ip-4:READ', config);
    const blocked = slidingWindowRateLimit('test-ip-4:READ', config);
    expect(blocked.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1_500);

    const after = slidingWindowRateLimit('test-ip-4:READ', config);
    expect(after.success).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it('keeps separate buckets per identifier', () => {
    const config = { limit: 1, windowMs: 60_000 };
    const first = slidingWindowRateLimit('ip-a:READ', config);
    const second = slidingWindowRateLimit('ip-b:READ', config);
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
  });
});
