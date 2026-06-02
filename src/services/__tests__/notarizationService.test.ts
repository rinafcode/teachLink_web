import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notarizeTip } from '@/services/notarizationService';

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

describe('notarizationService', () => {
  it('submits notarization payload and returns record', async () => {
    const payload = {
      txHash: '0xabc',
      recipientId: 'user-99',
      amount: 0.05,
      senderAddress: 'anonymous',
      chainId: 'server',
      timestamp: 1680000000000,
    };

    const responsePayload = {
      id: 'notarization-user-99-1680000000000-abc',
      proof: 'proof-hash',
      recordedAt: '2024-03-28T00:00:00.000Z',
      payload,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responsePayload,
    });

    const result = await notarizeTip(payload);

    expect(result).toEqual(responsePayload);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/notarization',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws when the API responds with failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Notarization failed' }),
    });

    await expect(
      notarizeTip({
        txHash: '0xabc',
        recipientId: 'user-99',
        amount: 0.05,
        senderAddress: 'anonymous',
        chainId: 'server',
        timestamp: 1680000000000,
      }),
    ).rejects.toThrow('Notarization failed');
  });
});
