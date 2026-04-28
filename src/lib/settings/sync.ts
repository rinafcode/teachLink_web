import { ANONYMOUS_SETTINGS_USER_KEY } from './constants';
import { type AppSettings, appSettingsSchema } from './types';

export interface RemoteSettingsPayload {
  settings: AppSettings;
  updatedAt: number;
}

/**
 * Resolves a stable key for server-side settings storage.
 * Logged-in users use their account id; others get a per-browser anonymous id.
 */
export function resolveSyncUserId(loggedUserId: string | null | undefined): string {
  if (loggedUserId && loggedUserId.length > 0) return loggedUserId;
  if (typeof window === 'undefined') return 'anon-ssr';
  try {
    let id = window.localStorage.getItem(ANONYMOUS_SETTINGS_USER_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANONYMOUS_SETTINGS_USER_KEY, id);
    }
    return `anon-${id}`;
  } catch {
    return 'anon-fallback';
  }
}

export async function fetchRemoteSettings(userId: string): Promise<RemoteSettingsPayload | null> {
  const res = await fetch(`/api/user/settings?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success?: boolean;
    data?: { settings: AppSettings; updatedAt: number };
  };
  if (!json.success || !json.data) return null;
  const validated = appSettingsSchema.safeParse(json.data.settings);
  if (!validated.success) return null;
  return { settings: validated.data, updatedAt: json.data.updatedAt };
}

export async function pushRemoteSettings(
  userId: string,
  payload: RemoteSettingsPayload,
): Promise<boolean> {
  const res = await fetch(`/api/user/settings`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      settings: payload.settings,
      updatedAt: payload.updatedAt,
    }),
  });
  return res.ok;
}
