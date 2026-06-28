import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '../store';

beforeEach(() => {
  useSettingsStore.getState().resetSettings();
});

describe('useSettingsStore', () => {
  it('falls back to the default language for unsupported locales', () => {
    useSettingsStore.getState().patchSettings({ language: 'zz-ZZ' });

    expect(useSettingsStore.getState().settings.language).toBe('en');
  });

  it('keeps supported languages when patching settings', () => {
    useSettingsStore.getState().patchSettings({ language: 'fr' });

    expect(useSettingsStore.getState().settings.language).toBe('fr');
  });
});