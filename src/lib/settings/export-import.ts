import { z } from 'zod';
import { SETTINGS_SCHEMA_VERSION } from './constants';
import {
  type AppSettings,
  appSettingsSchema,
  exportedSettingsEnvelopeSchema,
  type ExportedSettingsEnvelope,
  createDefaultSettings,
} from './types';

/** Build a downloadable export payload with metadata. */
export function buildExportEnvelope(
  settings: AppSettings,
  updatedAt: number,
): ExportedSettingsEnvelope {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings:
      SETTINGS_SCHEMA_VERSION === settings.version
        ? settings
        : { ...createDefaultSettings(), ...settings, version: SETTINGS_SCHEMA_VERSION },
    updatedAt,
  };
}

/** Parse pasted or uploaded JSON for import (strict where possible). */
export function parseExportedSettings(raw: unknown): AppSettings | { error: string } {
  const parsed = exportedSettingsEnvelopeSchema.safeParse(raw);
  if (parsed.success) {
    return appSettingsSchema.parse(parsed.data.settings);
  }

  const looseSettings = raw as { settings?: unknown };
  if (!looseSettings?.settings || typeof looseSettings.settings !== 'object') {
    return { error: 'Invalid file: missing settings object.' };
  }

  const onlySettings = looseSettings.settings as Record<string, unknown>;

  let merged: Partial<AppSettings> = {};
  if (onlySettings.version === SETTINGS_SCHEMA_VERSION) {
    const r = appSettingsSchema.safeParse(onlySettings);
    if (r.success) return r.data;
    merged = onlySettings as Partial<AppSettings>;
  } else {
    merged = {
      theme:
        typeof onlySettings.theme === 'string'
          ? (onlySettings.theme as AppSettings['theme'])
          : undefined,
      language: typeof onlySettings.language === 'string' ? onlySettings.language : undefined,
      notificationsEnabled:
        typeof onlySettings.notificationsEnabled === 'boolean'
          ? onlySettings.notificationsEnabled
          : undefined,
      emailNotifications:
        typeof onlySettings.emailNotifications === 'boolean'
          ? onlySettings.emailNotifications
          : undefined,
      prefetchingEnabled:
        typeof onlySettings.prefetchingEnabled === 'boolean'
          ? onlySettings.prefetchingEnabled
          : undefined,
      reducedMotion:
        typeof onlySettings.reducedMotion === 'boolean' ? onlySettings.reducedMotion : undefined,
    };
  }

  const base = createDefaultSettings();
  const patched = appSettingsSchema.safeParse({
    ...base,
    ...merged,
    version: SETTINGS_SCHEMA_VERSION,
    theme:
      merged.theme && z.enum(['light', 'dark', 'system']).safeParse(merged.theme).success
        ? merged.theme
        : base.theme,
  });

  return patched.success ? patched.data : { error: 'Invalid settings payload.' };
}
