import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { RATE_LIMIT_TIERS } from '@/lib/ratelimit';

// Silence the logger so error reports don't pollute test output.
vi.mock('@/lib/logging', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

const LIMIT = RATE_LIMIT_TIERS.REPORTING.limit;

let ipCounter = 0;
/** Fresh IP per call keeps each test isolated from the shared in-memory store. */
function makeRequest(body: unknown, ip = `203.0.113.${ipCounter++}`): NextRequest {
  return new NextRequest('https://example.com/api/errors/report', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

const sampleReport = {
  id: 'rep_1',
  sessionId: 'sess_1',
  userId: 'user_1',
  url: 'https://example.com/page',
  environment: 'production',
  errorData: { message: 'Something broke', type: 'TypeError' },
};

describe('POST /api/errors/report rate limiting', () => {
  beforeEach(() => {
    ipCounter = 0;
  });

  it('accepts legitimate error reports within the limit', async () => {
    const res = await POST(makeRequest(sampleReport));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('returns 429 once the per-IP limit is exceeded', async () => {
    const ip = '198.51.100.1';

    // Exhaust the allowed quota for this IP.
    for (let i = 0; i < LIMIT; i++) {
      const ok = await POST(makeRequest(sampleReport, ip));
      expect(ok.status).toBe(200);
    }

    // The next request from the same IP is rate limited.
    const blocked = await POST(makeRequest(sampleReport, ip));
    expect(blocked.status).toBe(429);
  });

  it('includes a Retry-After header on the 429 response', async () => {
    const ip = '198.51.100.2';

    for (let i = 0; i < LIMIT; i++) {
      await POST(makeRequest(sampleReport, ip));
    }
    const blocked = await POST(makeRequest(sampleReport, ip));

    expect(blocked.status).toBe(429);
    const retryAfter = blocked.headers.get('Retry-After');
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it('does not let one IP exhaust another IP quota', async () => {
    const noisy = '198.51.100.3';
    for (let i = 0; i < LIMIT; i++) {
      await POST(makeRequest(sampleReport, noisy));
    }
    expect((await POST(makeRequest(sampleReport, noisy))).status).toBe(429);

    // A different IP is unaffected.
    const other = await POST(makeRequest(sampleReport, '198.51.100.4'));
    expect(other.status).toBe(200);
  });
});
