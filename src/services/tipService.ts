import { TipNotarizationResponse } from '@/services/notarizationService';

export interface TipPayload {
  recipientId: string;
  amount: number;
  /**
   * Client-generated idempotency key. When omitted, `sendTip` generates one so
   * the same submission intent always carries a stable key that the API can use
   * to deduplicate retries.
   */
  idempotencyKey?: string;
}

export interface TipSendResult extends TipNotarizationResponse {
  txHash: string;
  recipientId: string;
  amount: number;
}

/**
 * Generates a client-side idempotency key for a tip submission. The key is
 * derived from the submission intent (recipient + amount) plus a random
 * component so rapid double-taps share the same key while genuinely distinct
 * submissions do not.
 */
export function generateTipIdempotencyKey(recipientId: string, amount: number): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `tip-${recipientId}-${amount}-${random}`;
}

// In-flight submissions keyed by submission intent (recipient + amount). A
// double tap reuses the same request instead of submitting the tip twice.
const inFlightSubmissions = new Map<string, Promise<TipSendResult>>();

export async function sendTip(payload: TipPayload): Promise<TipSendResult> {
  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new Error('Tip amount must be greater than zero.');
  }

  const dedupeKey = `${payload.recipientId}:${payload.amount}`;
  const inFlight = inFlightSubmissions.get(dedupeKey);
  if (inFlight) {
    return inFlight;
  }

  const idempotencyKey =
    payload.idempotencyKey ?? generateTipIdempotencyKey(payload.recipientId, payload.amount);

  const submission = doSendTip({ ...payload, idempotencyKey }).finally(() => {
    inFlightSubmissions.delete(dedupeKey);
  });
  inFlightSubmissions.set(dedupeKey, submission);
  return submission;
}

async function doSendTip(payload: TipPayload): Promise<TipSendResult> {
  const response = await fetch('/api/tipping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      error?: unknown;
      message?: unknown;
    } | null;

    const message =
      typeof errorBody?.error === 'string'
        ? errorBody.error
        : typeof errorBody?.message === 'string'
          ? errorBody.message
          : 'Unable to send tip.';

    throw new Error(message);
  }

  return response.json();
}
