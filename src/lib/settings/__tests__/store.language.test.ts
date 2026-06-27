/**
 * @file store.language.test.ts
 *
 * Tests for language-setting validation in `useSettingsStore.patchSettings`.
 *
 * Covered behaviour:
 *  - Supported locales are stored unchanged.
 *  - Unsupported locales fall back to DEFAULT_LANGUAGE.
 *  - The old 24-character length clamp no longer applies to valid locales.
 *  - All locales currently listed in SUPPORTED_LANGUAGES continue to work.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../store';
import { createDefaultSettings } from '../types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/locales/config';

// ---------------------------------------------------------------------------
// Setup — mock localStorage used by the persist middleware
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// @ts-ignore
global.localStorage = localStorageMock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset Zustand store to defaults between tests to avoid cross-test pollution. */
function resetStore() {
  localStorageMock.clear();
  useSettingsStore.setState({
    settings: createDefaultSettings(),
    updatedAt: Date.now(),
    lastSyncedAt: null,
  });
}

function patchLanguage(lang: string) {
  useSettingsStore.getState().patchSettings({ language: lang });
  return useSettingsStore.getState().settings.language;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSettingsStore — language validation', () => {
  beforeEach(() => {
    resetStore();
  });

  // -- Supported locales ----------------------------------------------------

  it('stores a valid supported locale unchanged', () => {
    expect(patchLanguage('fr')).toBe('fr');
  });

  it('stores "en" (DEFAULT_LANGUAGE) unchanged', () => {
    expect(patchLanguage('en')).toBe('en');
  });

  it('stores every locale listed in SUPPORTED_LANGUAGES without modification', () => {
    const supported = Object.keys(SUPPORTED_LANGUAGES);
    for (const locale of supported) {
      resetStore();
      expect(patchLanguage(locale)).toBe(locale);
    }
  });

  // -- Unsupported locales --------------------------------------------------

  it('falls back to DEFAULT_LANGUAGE for a completely unknown locale', () => {
    expect(patchLanguage('xx')).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to DEFAULT_LANGUAGE for an empty string', () => {
    expect(patchLanguage('')).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to DEFAULT_LANGUAGE for a locale-like string not in the allowlist', () => {
    // 'en-GB' looks valid but is not a key in SUPPORTED_LANGUAGES
    expect(patchLanguage('en-GB')).toBe(DEFAULT_LANGUAGE);
  });

  it('falls back to DEFAULT_LANGUAGE for a numeric string', () => {
    expect(patchLanguage('1234')).toBe(DEFAULT_LANGUAGE);
  });

  // -- Old 24-char clamp removed -------------------------------------------

  it('does not clamp or store locales longer than 24 characters — they fall back instead', () => {
    // Under the old scheme a 25-char string would be sliced to 24 chars and stored.
    // Under the new scheme it is not in SUPPORTED_LANGUAGES, so it falls back.
    const longLocale = 'a'.repeat(25);
    expect(patchLanguage(longLocale)).toBe(DEFAULT_LANGUAGE);
  });

  it('does not trim or modify a valid locale with surrounding whitespace — it falls back', () => {
    // The old implementation called .trim(); the new one does not —
    // '  en  ' is not a key in SUPPORTED_LANGUAGES.
    expect(patchLanguage('  en  ')).toBe(DEFAULT_LANGUAGE);
  });

  // -- Store state integrity ------------------------------------------------

  it('does not mutate other settings when language is patched', () => {
    const before = useSettingsStore.getState().settings;
    patchLanguage('es');
    const after = useSettingsStore.getState().settings;
    expect(after.theme).toBe(before.theme);
    expect(after.notificationsEnabled).toBe(before.notificationsEnabled);
  });

  it('updates updatedAt when a valid language is patched', () => {
    const before = useSettingsStore.getState().updatedAt;
    patchLanguage('ja');
    const after = useSettingsStore.getState().updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
