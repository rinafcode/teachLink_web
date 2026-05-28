import { z } from 'zod';
import { SETTINGS_SCHEMA_VERSION } from './constants';

/** User-selectable colour scheme. `'system'` follows the OS preference. */
export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

/**
 * Validated schema for all user-configurable application settings.
 *
 * Fields:
 * - `version`              — Schema version; bumped when new fields are added (see `SETTINGS_SCHEMA_VERSION`).
 * - `theme`                — Colour scheme: `'light'`, `'dark'`, or `'system'` (follows OS preference).
 * - `language`             — BCP-47 locale tag (e.g. `'en'`, `'fr-CA'`), max 24 chars; defaults to `navigator.language`.
 * - `notificationsEnabled` — Master toggle for in-app push/toast notifications.
 * - `emailNotifications`   — Whether transactional and digest emails should be sent.
 * - `prefetchingEnabled`   — Pre-fetches linked pages on hover for faster navigation; disable on slow connections.
 * - `reducedMotion`        — Suppresses non-essential animations for users who prefer reduced motion.
 */
export const appSettingsSchema = z.object({
  version: z.literal(SETTINGS_SCHEMA_VERSION),
  theme: themePreferenceSchema,
  language: z.string().max(24),
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  prefetchingEnabled: z.boolean(),
  reducedMotion: z.boolean(),
});

/** Fully typed representation of all user settings. Inferred from `appSettingsSchema`. */
export type AppSettings = z.infer<typeof appSettingsSchema>;

/**
 * Shape persisted by the Zustand store to `localStorage` (key: `SETTINGS_STORAGE_KEY`).
 * Includes `updatedAt` and `lastSyncedAt` for conflict resolution during remote sync.
 */
export const settingsStoreStateSchema = z.object({
  settings: appSettingsSchema,
  /** Unix ms timestamp of the last local mutation. Used as a vector clock for sync. */
  updatedAt: z.number(),
  /** Unix ms timestamp of the last successful remote sync, or `null` if never synced. */
  lastSyncedAt: z.number().nullable(),
});

export type SettingsStorePersistedShape = z.infer<typeof settingsStoreStateSchema>;

/**
 * JSON envelope produced by `buildExportEnvelope` and consumed by `parseExportedSettings`.
 * Including `exportedAt` and `version` allows future migrations to detect stale exports.
 */
export const exportedSettingsEnvelopeSchema = z.object({
  version: z.literal(SETTINGS_SCHEMA_VERSION),
  /** ISO-8601 UTC timestamp of when the file was exported. */
  exportedAt: z.string(),
  settings: appSettingsSchema,
  updatedAt: z.number(),
});

export type ExportedSettingsEnvelope = z.infer<typeof exportedSettingsEnvelopeSchema>;

/**
 * Returns an `AppSettings` object with safe, well-defined defaults.
 *
 * - `theme` defaults to `'system'` so the OS preference is respected out of the box.
 * - `language` is read from `navigator.language` when available, falling back to `'en'`.
 * - All notification and UX toggles default to their most permissive value.
 */
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
