'use client';

/**
 * @module settings/store
 *
 * Zustand store for user application settings.
 *
 * ## Quick start
 *
 * ```tsx
 * import { useSettingsStore } from '@/lib/settings/store';
 *
 * function MyComponent() {
 *   const theme = useSettingsStore((s) => s.settings.theme);
 *   const patchSettings = useSettingsStore((s) => s.patchSettings);
 *
 *   return (
 *     <button onClick={() => patchSettings({ theme: 'dark' })}>
 *       Switch to dark mode
 *     </button>
 *   );
 * }
 * ```
 *
 * ## Persistence
 *
 * Settings are automatically persisted to `localStorage` under the key defined by
 * `SETTINGS_STORAGE_KEY`. The store handles SSR gracefully by falling back to a no-op
 * storage when `window` is unavailable.
 *
 * ## Sync
 *
 * Use `fetchRemoteSettings` / `pushRemoteSettings` from `@/lib/settings/sync` to
 * synchronise settings with the server. `updatedAt` acts as a vector clock: the
 * side with the larger value wins.
 *
 * ## Export / Import
 *
 * Use `buildExportEnvelope` / `parseExportedSettings` from `@/lib/settings/export-import`
 * to serialise settings to a portable JSON file that users can download and re-import.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_STORAGE_KEY } from './constants';
import { type AppSettings, appSettingsSchema, createDefaultSettings } from './types';

interface SettingsStoreActions {
  /**
   * Merge a partial update into the current settings.
   * Validates the merged result against `appSettingsSchema`; silently ignores invalid patches.
   * `language` is trimmed and clamped to 24 chars; empty strings fall back to `'en'`.
   * Automatically updates `updatedAt` to `Date.now()`.
   */
  patchSettings: (partial: Partial<AppSettings>) => void;

  /**
   * Overwrite all settings with a validated `AppSettings` object (e.g. after a remote sync or import).
   * Pass `markSynced = true` to set `lastSyncedAt` to `updatedAt` in the same write.
   * Invalid settings objects are silently dropped.
   */
  replaceSettings: (settings: AppSettings, updatedAt: number, markSynced?: boolean) => void;

  /**
   * Restore all settings to the application defaults (see `createDefaultSettings`).
   * Resets `updatedAt` to `Date.now()` and clears `lastSyncedAt`.
   */
  resetSettings: () => void;

  /**
   * Record the timestamp of the last successful remote sync.
   * Pass `null` to clear the sync marker (e.g. after a reset).
   */
  setLastSyncedAt: (t: number | null) => void;
}

interface SettingsSlice extends SettingsStoreActions {
  /** Current user preferences. Always conforms to `appSettingsSchema`. */
  settings: AppSettings;
  /** Unix ms timestamp of the last local settings mutation. Used as a vector clock for sync. */
  updatedAt: number;
  /** Unix ms timestamp of the most recent successful remote sync, or `null` if never synced. */
  lastSyncedAt: number | null;
}

const noopStorage = {
  getItem: (): string | null => null,
  setItem: (): void => undefined,
  removeItem: (): void => undefined,
};

function localStorageOrNoop() {
  if (typeof window === 'undefined') return noopStorage;
  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

export const useSettingsStore = create<SettingsSlice>()(
  persist(
    (set, get) => ({
      settings: createDefaultSettings(),
      updatedAt: Date.now(),
      lastSyncedAt: null,

      patchSettings: (partial) => {
        const prev = get().settings;
        const merged = {
          ...prev,
          ...partial,
          version: SETTINGS_SCHEMA_VERSION,
          ...(partial.language !== undefined
            ? {
                language: partial.language.trim().slice(0, 24) || 'en',
              }
            : {}),
        };
        const parsed = appSettingsSchema.safeParse(merged);
        if (!parsed.success) return;
        set({
          settings: parsed.data,
          updatedAt: Date.now(),
        });
      },

      replaceSettings: (settings, updatedAt, markSynced) => {
        const parsed = appSettingsSchema.safeParse(settings);
        if (!parsed.success) return;
        set({
          settings: parsed.data,
          updatedAt,
          lastSyncedAt: markSynced ? updatedAt : get().lastSyncedAt,
        });
      },

      resetSettings: () =>
        set({
          settings: createDefaultSettings(),
          updatedAt: Date.now(),
          lastSyncedAt: null,
        }),

      setLastSyncedAt: (t) => set({ lastSyncedAt: t }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorageOrNoop()),
      partialize: (state) => ({
        settings: state.settings,
        updatedAt: state.updatedAt,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
