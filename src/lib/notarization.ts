import { createHash } from 'crypto';

export interface TipNotarizationPayload {
  txHash: string;
  recipientId: string;
  amount: number;
  senderAddress: string;
  chainId: string;
  timestamp: number;
}

export interface TipNotarizationRecord {
  id: string;
  proof: string;
  recordedAt: string;
  payload: TipNotarizationPayload;
}

export function buildNotarizationHash(payload: TipNotarizationPayload): string {
  const normalizedPayload = JSON.stringify({
    txHash: payload.txHash,
    recipientId: payload.recipientId,
    amount: payload.amount,
    senderAddress: payload.senderAddress,
    chainId: payload.chainId,
    timestamp: payload.timestamp,
  });

  return createHash('sha256').update(normalizedPayload).digest('hex');
}

export function generateNotarizationId(payload: TipNotarizationPayload): string {
  return `notarization-${payload.recipientId}-${payload.timestamp}-${payload.txHash.slice(2, 10)}`;
}
