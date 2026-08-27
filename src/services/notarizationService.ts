import { timingSafeEqual } from 'crypto';
import { buildNotarizationHash } from '@/lib/notarization';

export interface TipNotarizationRequest {
  txHash: string;
  recipientId: string;
  amount: number;
  senderAddress: string;
  chainId: string;
  timestamp: number;
}

export interface TipNotarizationResponse {
  id: string;
  proof: string;
  recordedAt: string;
  payload: TipNotarizationRequest;
}

function verifyNotarizationProof(response: TipNotarizationResponse): boolean {
  const expected = Buffer.from(buildNotarizationHash(response.payload), 'hex');
  const actual = Buffer.from(response.proof, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function notarizeTip(
  notarization: TipNotarizationRequest,
): Promise<TipNotarizationResponse> {
  const response = await fetch('/api/notarization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notarization),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || 'Unable to notarize tip transaction');
  }

  const result = (await response.json()) as TipNotarizationResponse;
  if (!verifyNotarizationProof(result)) {
    throw new Error('Invalid notarization signature');
  }

  return result;
}
