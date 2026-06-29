/**
 * Validated schema for all user-configurable application settings.
 */
import { z } from 'zod';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_DOCUMENTATION_VERSION } from './constants';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/locales/config';

/** User-selectable colour scheme. `'system'` follows the OS preference. */
export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const virtualBackgroundTypeSchema = z.enum(['none', 'blur', 'image', 'color']);
export type VirtualBackgroundType = z.infer<typeof virtualBackgroundTypeSchema>;

/**
 * Validated schema for all user-configurable application settings.
 *
 * Fields:
 * - `version`                         — Schema version; bumped when new fields are added (see `SETTINGS_SCHEMA_VERSION`).
 * - `theme`                           — Colour scheme: `'light'`, `'dark'`, or `'system'` (follows OS preference).
 * - `language`                        — A key from `SUPPORTED_LANGUAGES` (e.g. `'en'`, `'fr'`); defaults to `DEFAULT_LANGUAGE`.
 * - `notificationsEnabled`            — Master toggle for in-app push/toast notifications.
 * - `emailNotifications`              — Whether transactional and digest emails should be sent.
 * - `prefetchingEnabled`              — Pre-fetches linked pages on hover for faster navigation; disable on slow connections.
 * - `reducedMotion`                   — Suppresses non-essential animations for users who prefer reduced motion.
 * - `electronicSignatureEnabled`      — Master toggle for electronic signature on authenticated actions.
 * - `signatureName`                   — Full name used as the typed electronic signature (max 100 chars).
 * - `requireSignatureOnCertificates`  — Prompt the user to confirm their signature before a certificate is issued.
 * - `pollCreationEnabled`             — Master toggle for creating interactive polls in classes or study groups.
 * - `defaultPollDuration`             — Default poll duration in days (1 to 30 days).
 * - `allowAnonymousVoting`            — Toggle to allow participants to vote anonymously by default.
 * - `pollResultsVisibility`           — Default visibility of poll results ('always' | 'after_voting' | 'after_ended').
 */
export const appSettingsSchema = z.object({
  version: z.literal(SETTINGS_SCHEMA_VERSION),
  theme: themePreferenceSchema,
  language: z.enum(
    Object.keys(SUPPORTED_LANGUAGES) as [string, ...string[]]
  ),
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  prefetchingEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  electronicSignatureEnabled: z.boolean(),
  signatureName: z.string().max(100),
  requireSignatureOnCertificates: z.boolean(),
  pollCreationEnabled: z.boolean(),
  defaultPollDuration: z.number().int().min(1).max(30),
  allowAnonymousVoting: z.boolean(),
  pollResultsVisibility: z.enum(['always', 'after_voting', 'after_ended']),
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
 * - Virtual background is disabled by default with 'none' type.
 */
export function createDefaultSettings(): AppSettings {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    theme: 'system',
    language: typeof navigator !== 'undefined' && navigator.language in SUPPORTED_LANGUAGES
      ? navigator.language
      : DEFAULT_LANGUAGE,
    notificationsEnabled: true,
    emailNotifications: true,
    prefetchingEnabled: true,
    reducedMotion: false,
    electronicSignatureEnabled: false,
    signatureName: '',
    requireSignatureOnCertificates: false,
    pollCreationEnabled: true,
    defaultPollDuration: 7,
    allowAnonymousVoting: false,
    pollResultsVisibility: 'always',
  };
}
