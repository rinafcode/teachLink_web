import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTip, generateTipIdempotencyKey } from '@/services/tipService';

declare global {
  var fetch: typeof fetch;
}

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fakeResponse = {
  txHash: '0xabc',
  recipientId: 'user-99',
  amount: 0.05,
  id: 'notarization-user-99-1234567890-abc123',
  proof: 'proof-value',
  recordedAt: '2026-01-01T00:00:00.000Z',
};

function getRequestBody(): Record<string, unknown> {
  const [, init] = mockFetch.mock.calls[0];
  return JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
}

describe('tipService', () => {
  it('sends a tip request and returns result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeResponse,
    });

    const result = await sendTip({ recipientId: 'user-99', amount: 0.05 });

    expect(result).toEqual(fakeResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tipping',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws when amount is invalid', async () => {
    await expect(sendTip({ recipientId: 'user-99', amount: 0 })).rejects.toThrow(
      'Tip amount must be greater than zero.',
    );
  });

  it('uses the fallback message when the API error payload is not a string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { detail: 'Bad request' } }),
    });

    await expect(sendTip({ recipientId: 'user-99', amount: 0.05 })).rejects.toThrow(
      'Unable to send tip.',
    );
  });

  it('throws when the API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad request' }),
    });

    await expect(sendTip({ recipientId: 'user-99', amount: 0.05 })).rejects.toThrow('Bad request');
  });

  it('generates a stable-shaped idempotency key for a submission intent', () => {
    const key = generateTipIdempotencyKey('user-99', 0.05);
    expect(key).toMatch(/^tip-user-99-0\.05-[A-Za-z0-9-]+$/);
  });

  it('includes a client-generated idempotency key in the request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeResponse,
    });

    await sendTip({ recipientId: 'user-99', amount: 0.05 });

    expect(getRequestBody().idempotencyKey).toMatch(/^tip-user-99-0\.05-/);
  });

  it('honors an explicit idempotency key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeResponse,
    });

    await sendTip({ recipientId: 'user-99', amount: 0.05, idempotencyKey: 'tip-custom-key-1' });

    expect(getRequestBody().idempotencyKey).toBe('tip-custom-key-1');
  });

  it('dedupes concurrent double-tap submissions into a single request', async () => {
    let resolveFetch!: (value: { ok: boolean; json: () => Promise<unknown> }) => void;
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = sendTip({ recipientId: 'user-99', amount: 0.05 });
    const second = sendTip({ recipientId: 'user-99', amount: 0.05 });

    resolveFetch({ ok: true, json: async () => fakeResponse });

    const [r1, r2] = await Promise.all([first, second]);
    expect(r1).toEqual(fakeResponse);
    expect(r2).toEqual(fakeResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('allows a new submission once the previous one settles', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => fakeResponse,
    });

    await sendTip({ recipientId: 'user-99', amount: 0.05 });
    await sendTip({ recipientId: 'user-99', amount: 0.05 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
