import { TipNotarizationResponse } from '@/services/notarizationService';

export interface TipPayload {
  recipientId: string;
  amount: number;
}

export interface TipSendResult extends TipNotarizationResponse {
  txHash: string;
  recipientId: string;
  amount: number;
}

export async function sendTip(payload: TipPayload): Promise<TipSendResult> {
  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new Error('Tip amount must be greater than zero.');
  }

  const response = await fetch('/api/tipping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || 'Failed to send tip.');
  }

  return response.json();
}
