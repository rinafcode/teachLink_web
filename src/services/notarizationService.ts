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

  return response.json();
}
