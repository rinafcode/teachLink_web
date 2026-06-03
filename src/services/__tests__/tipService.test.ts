import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTip } from '@/services/tipService';

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

describe('tipService', () => {
  it('sends a tip request and returns result', async () => {
    const fakeResponse = {
      txHash: '0xabc',
      recipientId: 'user-99',
      amount: 0.05,
      notarizationId: 'notarization-user-99-1234567890-abc123',
      notarizationProof: 'proof-value',
      notarizedAt: '2026-01-01T00:00:00.000Z',
    };

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

  it('throws when the API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad request' }),
    });

    await expect(sendTip({ recipientId: 'user-99', amount: 0.05 })).rejects.toThrow('Bad request');
  });
});
