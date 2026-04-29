import { z } from 'zod';
import { SETTINGS_SCHEMA_VERSION } from './constants';

export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const appSettingsSchema = z.object({
  version: z.literal(SETTINGS_SCHEMA_VERSION),
  theme: themePreferenceSchema,
  language: z.string().max(24),
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  prefetchingEnabled: z.boolean(),
  reducedMotion: z.boolean(),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const settingsStoreStateSchema = z.object({
  settings: appSettingsSchema,
  updatedAt: z.number(),
  lastSyncedAt: z.number().nullable(),
});

export type SettingsStorePersistedShape = z.infer<typeof settingsStoreStateSchema>;

export const exportedSettingsEnvelopeSchema = z.object({
  version: z.literal(SETTINGS_SCHEMA_VERSION),
  exportedAt: z.string(),
  settings: appSettingsSchema,
  updatedAt: z.number(),
});

export type ExportedSettingsEnvelope = z.infer<typeof exportedSettingsEnvelopeSchema>;

export function createDefaultSettings(): AppSettings {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    theme: 'system',
    language: typeof navigator !== 'undefined' ? (navigator.language || 'en').slice(0, 24) : 'en',
    notificationsEnabled: true,
    emailNotifications: true,
    prefetchingEnabled: true,
    reducedMotion: false,
  };
}
