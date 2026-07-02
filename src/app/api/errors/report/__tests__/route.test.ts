import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { RATE_LIMIT_TIERS } from '@/lib/ratelimit';

// Capture what the route hands to the logger so tests can assert on it.
// `vi.mock` factories are hoisted above imports, so the mock fns must be
// created via `vi.hoisted` to be safely referenced inside the factory.
const { loggerError, loggerWarn } = vi.hoisted(() => ({
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}));

// Silence the logger so error reports don't pollute test output, but keep the
// real `redactObject` implementation so PII-scrubbing behavior is exercised.
vi.mock('@/lib/logging', async () => {
  const actual = await vi.importActual<typeof import('@/lib/logging')>('@/lib/logging');
  return {
    ...actual,
    createLogger: () => ({
      error: loggerError,
      warn: loggerWarn,
      info: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

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
    loggerError.mockClear();
    loggerWarn.mockClear();
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

describe('POST /api/errors/report PII scrubbing', () => {
  beforeEach(() => {
    ipCounter = 0;
    loggerError.mockClear();
    loggerWarn.mockClear();
  });

  it('redacts known PII fields (email, password) before logging', async () => {
    const reportWithPii = {
      ...sampleReport,
      email: 'user@example.com',
      password: 'super-secret-password-123',
      context: {
        formState: {
          email: 'nested@example.com',
          password: 'nested-secret',
          card: '4111111111111111',
          ssn: '123-45-6789',
          phone: '555-0100',
          token: 'abc.def.ghi',
        },
      },
    };

    const res = await POST(makeRequest(reportWithPii));
    expect(res.status).toBe(200);

    expect(loggerError).toHaveBeenCalledTimes(1);
    const [, payload] = loggerError.mock.calls[0];
    const context = payload.context as Record<string, any>;

    // Known PII fields are redacted.
    expect(context.email).toBe('[REDACTED]');
    expect(context.password).toBe('[REDACTED]');
    expect(context.context.formState.email).toBe('[REDACTED]');
    expect(context.context.formState.password).toBe('[REDACTED]');
    expect(context.context.formState.card).toBe('[REDACTED]');
    expect(context.context.formState.ssn).toBe('[REDACTED]');
    expect(context.context.formState.phone).toBe('[REDACTED]');
    expect(context.context.formState.token).toBe('[REDACTED]');

    // Non-PII fields are logged as-is.
    expect(context.url).toBe(sampleReport.url);
    expect(context.environment).toBe(sampleReport.environment);
    expect(context.sessionId).toBe(sampleReport.sessionId);
    expect(payload.error?.message).toBe(sampleReport.errorData.message);
    expect(payload.error?.name).toBe(sampleReport.errorData.type);
  });
});
