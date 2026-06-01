export interface TipPayload {
  recipientId: string;
  amount: number;
  groupId: string;
  groupName: string;
}

export interface TipResult {
  success: true;
  tipId: string;
  createdAt: string;
}

export async function sendTip(payload: TipPayload): Promise<TipResult> {
  const response = await fetch('/api/tips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({ error: 'Unable to parse response' }));

  if (!response.ok) {
    const message = typeof responseBody.error === 'string' ? responseBody.error : 'Unable to send tip.';
    throw new Error(message);
  }

  return responseBody as TipResult;
}
