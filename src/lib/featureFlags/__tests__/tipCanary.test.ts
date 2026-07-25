import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTipCanary } from '../tipCanary';

function makeReq(cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return {
    cookies: {
      get: (k: string) => ({ value: cookies[k] }),
    },
    headers: {
      get: (k: string) => headers[k.toLowerCase()],
    },
  } as any;
}

describe('evaluateTipCanary', () => {
  const originalEnv = process.env.TIP_RECEIVING_CANARY_PERCENT;

  beforeEach(() => {
    delete process.env.TIP_RECEIVING_CANARY_PERCENT;
  });

  it('returns disabled for 0 percent', () => {
    process.env.TIP_RECEIVING_CANARY_PERCENT = '0';
    const res = evaluateTipCanary(makeReq());
    expect(res.enabled).toBe(false);
    expect(res.percent).toBe(0);
  });

  it('buckets deterministically for same user id', () => {
    process.env.TIP_RECEIVING_CANARY_PERCENT = '100';
    const req = makeReq({ 'user-id': 'user-123' });
    const a = evaluateTipCanary(req);
    const b = evaluateTipCanary(req);
    expect(a.bucket).toBe(b.bucket);
    expect(a.enabled).toBe(true);
  });

  it('respects percent boundaries', () => {
    process.env.TIP_RECEIVING_CANARY_PERCENT = '1';
    const req = makeReq({ 'user-id': 'low-bucket' });
    const res = evaluateTipCanary(req);
    expect(res.percent).toBe(1);
    expect(res.bucket).toBeGreaterThanOrEqual(1);
    expect(res.bucket).toBeLessThanOrEqual(100);
  });

  it('generates anon id when no identifier present and returns setAnonId', () => {
    process.env.TIP_RECEIVING_CANARY_PERCENT = '50';
    const req = makeReq();
    const res = evaluateTipCanary(req);
    expect(res.setAnonId).toBeDefined();
    expect(res.bucket).toBeGreaterThanOrEqual(1);
  });
});
