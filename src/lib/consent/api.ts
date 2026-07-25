/**
 * @module consent/api
 * Client-side API calls to the consent microservice endpoint.
 */
import type { ConsentPreferences } from './types';

const CONSENT_API = '/api/v1/consent';

export interface RemoteConsentPayload {
  userId: string;
  preferences: ConsentPreferences;
  decidedAt: number;
}

/** Fetch stored consent preferences for a user from the server. */
export async function fetchRemoteConsent(userId: string): Promise<RemoteConsentPayload | null> {
  try {
    const res = await fetch(`${CONSENT_API}?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: RemoteConsentPayload };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/** Push consent preferences to the server for cross-device persistence. */
export async function pushRemoteConsent(payload: RemoteConsentPayload): Promise<boolean> {
  try {
    const res = await fetch(CONSENT_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
