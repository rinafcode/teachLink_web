'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme-provider';
import { useSettingsStore } from '@/lib/settings/store';
import { fetchRemoteSettings, pushRemoteSettings, resolveSyncUserId } from '@/lib/settings/sync';
import { useStore } from '@/store/stateManager';

/** Keeps ThemeProvider aligned with persisted app settings after hydration or edits. */
export function ThemeFromSettingsBootstrap() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}

/** Mirrors persisted settings into the legacy Zustand slice used by prefetch, profile drafts, etc. */
export function LegacyStorePreferencesBridge() {
  const settings = useSettingsStore((s) => s.settings);
  const setPreferences = useStore((s) => s.setPreferences);

  useEffect(() => {
    setPreferences({
      theme: settings.theme,
      language: settings.language,
      notifications: settings.notificationsEnabled && settings.emailNotifications,
      prefetching: settings.prefetchingEnabled,
    });
  }, [settings, setPreferences]);

  useEffect(() => {
    document.documentElement.dataset.teachlinkMotion = settings.reducedMotion
      ? 'reduced'
      : 'normal';
    return () => {
      delete document.documentElement.dataset.teachlinkMotion;
    };
  }, [settings.reducedMotion]);

  return null;
}

/**
 * Pull newer settings when the server has a copy indexed by sync key,
 * then push local changes debounced — enables cross-device sync for signed-in or anonymous IDs.
 */
export function RemoteSettingsSync() {
  const userId = useStore((s) => s.user.id);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      const id = resolveSyncUserId(userId);
      const remote = await fetchRemoteSettings(id);
      if (cancelled || !remote) return;

      const local = useSettingsStore.getState();
      if (remote.updatedAt <= local.updatedAt) return;

      local.replaceSettings(remote.settings, remote.updatedAt, true);
      local.setLastSyncedAt(remote.updatedAt);
    }

    void pull();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe((state, prevState) => {
      if (!prevState || state.updatedAt === prevState.updatedAt) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const current = useSettingsStore.getState();
        const uid = resolveSyncUserId(useStore.getState().user.id);
        void pushRemoteSettings(uid, {
          settings: current.settings,
          updatedAt: current.updatedAt,
        }).then((ok) => {
          if (ok) useSettingsStore.getState().setLastSyncedAt(Date.now());
        });
      }, 1200);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId]);

  return null;
}
