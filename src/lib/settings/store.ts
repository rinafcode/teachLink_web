'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_STORAGE_KEY } from './constants';
import { type AppSettings, appSettingsSchema, createDefaultSettings } from './types';

interface SettingsStoreActions {
  patchSettings: (partial: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings, updatedAt: number, markSynced?: boolean) => void;
  resetSettings: () => void;
  setLastSyncedAt: (t: number | null) => void;
}

interface SettingsSlice extends SettingsStoreActions {
  settings: AppSettings;
  updatedAt: number;
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
