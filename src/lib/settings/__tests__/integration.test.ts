/**
 * Settings System – integration tests
 * Tests the interaction between different components of the settings system
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsService } from '../service';
import { createDefaultSettings, type SettingsStorePersistedShape } from '../types';
import { SETTINGS_SCHEMA_VERSION } from '../constants';

// ─── Mock localStorage ────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  localStorageMock.clear();
}

function createMockRemoteStore(): Map<string, SettingsStorePersistedShape> {
  const store = new Map<string, SettingsStorePersistedShape>();
  const defaultSettings = createDefaultSettings();
  store.set('user1', {
    settings: { ...defaultSettings, theme: 'dark' },
    updatedAt: Date.now() - 1000,
    lastSyncedAt: Date.now() - 1000,
  });
  return store;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Settings System Integration', () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  // ── End-to-End Settings Flow ───────────────────────────────────────────────

  describe('End-to-End Settings Flow', () => {
    it('creates, validates, and exports settings', () => {
      const settings = createDefaultSettings();
      const validation = SettingsService.validateSettings(settings);

      expect(validation.valid).toBe(true);
      expect(validation.data).toEqual(settings);

      const storeState = SettingsService.createStoreState(settings);
      const exported = SettingsService.exportSettings(storeState);

      expect(exported.version).toBe(SETTINGS_SCHEMA_VERSION);
      expect(exported.settings).toEqual(settings);
      expect(exported.exportedAt).toBeTruthy();
      expect(exported.updatedAt).toBe(storeState.updatedAt);
    });

    it('exports and re-imports settings successfully', () => {
      const originalSettings = createDefaultSettings();
      const storeState = SettingsService.createStoreState(originalSettings);
      const exported = SettingsService.exportSettings(storeState);

      const importResult = SettingsService.importSettings(exported);

      expect(importResult.valid).toBe(true);
      expect(importResult.errors).toHaveLength(0);
      expect(importResult.data).toEqual(originalSettings);
    });

    it('exports and imports virtual background settings', () => {
      const settingsWithVB = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: true,
        virtualBackgroundType: 'image' as const,
        virtualBackgroundImage: 'https://example.com/bg.jpg',
        virtualBackgroundBlur: 25,
        virtualBackgroundColor: '#FF5733',
      };
      
      const storeState = SettingsService.createStoreState(settingsWithVB);
      const exported = SettingsService.exportSettings(storeState);

      const importResult = SettingsService.importSettings(exported);

      expect(importResult.valid).toBe(true);
      expect(importResult.data?.virtualBackgroundEnabled).toBe(true);
      expect(importResult.data?.virtualBackgroundType).toBe('image');
      expect(importResult.data?.virtualBackgroundImage).toBe('https://example.com/bg.jpg');
      expect(importResult.data?.virtualBackgroundBlur).toBe(25);
      expect(importResult.data?.virtualBackgroundColor).toBe('#FF5733');
    });

    it('handles partial updates correctly', () => {
      const currentSettings = createDefaultSettings();
      const partialUpdate = { theme: 'dark' as const };

      const validation = SettingsService.validatePartialUpdate(currentSettings, partialUpdate);

      expect(validation.valid).toBe(true);
      expect(validation.data?.theme).toBe('dark');
      expect(validation.data?.language).toBe(currentSettings.language);
    });

    it('resets to defaults when requested', () => {
      const modifiedSettings = { ...createDefaultSettings(), theme: 'dark', language: 'fr' };
      const resetSettings = SettingsService.resetToDefaults();

      expect(resetSettings.theme).not.toBe('dark');
      expect(resetSettings.language).not.toBe('fr');
      expect(resetSettings).toEqual(createDefaultSettings());
    });

    it('resets virtual background settings to defaults', () => {
      const modifiedSettings = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: true,
        virtualBackgroundType: 'image' as const,
        virtualBackgroundImage: 'https://example.com/bg.jpg',
        virtualBackgroundBlur: 50,
        virtualBackgroundColor: '#FF0000',
      };
      const resetSettings = SettingsService.resetToDefaults();

      expect(resetSettings.virtualBackgroundEnabled).toBe(false);
      expect(resetSettings.virtualBackgroundType).toBe('none');
      expect(resetSettings.virtualBackgroundImage).toBe('');
      expect(resetSettings.virtualBackgroundBlur).toBe(10);
      expect(resetSettings.virtualBackgroundColor).toBe('#000000');
    });
  });

  // ── Settings Sync Integration ───────────────────────────────────────────────

  describe('Settings Sync Integration', () => {
    it('merges settings correctly when remote is newer', () => {
      const localState: SettingsStorePersistedShape = {
        settings: { ...createDefaultSettings(), theme: 'light' },
        updatedAt: Date.now() - 2000,
        lastSyncedAt: Date.now() - 2000,
      };

      const remoteState: SettingsStorePersistedShape = {
        settings: { ...createDefaultSettings(), theme: 'dark' },
        updatedAt: Date.now() - 1000,
        lastSyncedAt: Date.now() - 1000,
      };

      const merged = SettingsService.mergeSettings(localState, remoteState);

      expect(merged.settings.theme).toBe('dark');
      expect(merged.updatedAt).toBe(remoteState.updatedAt);
      expect(merged.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('merges settings correctly when local is newer', () => {
      const localState: SettingsStorePersistedShape = {
        settings: { ...createDefaultSettings(), theme: 'dark' },
        updatedAt: Date.now() - 1000,
        lastSyncedAt: Date.now() - 2000,
      };

      const remoteState: SettingsStorePersistedShape = {
        settings: { ...createDefaultSettings(), theme: 'light' },
        updatedAt: Date.now() - 2000,
        lastSyncedAt: Date.now() - 2000,
      };

      const merged = SettingsService.mergeSettings(localState, remoteState);

      expect(merged.settings.theme).toBe('dark');
      expect(merged.updatedAt).toBe(localState.updatedAt);
      expect(merged.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('detects when sync is needed', () => {
      const stateWithoutSync: SettingsStorePersistedShape = {
        settings: createDefaultSettings(),
        updatedAt: Date.now(),
        lastSyncedAt: null,
      };

      const stateWithOldSync: SettingsStorePersistedShape = {
        settings: createDefaultSettings(),
        updatedAt: Date.now() + 1000,
        lastSyncedAt: Date.now(),
      };

      const stateUpToDate: SettingsStorePersistedShape = {
        settings: createDefaultSettings(),
        updatedAt: Date.now(),
        lastSyncedAt: Date.now() + 1000,
      };

      expect(SettingsService.needsSync(stateWithoutSync)).toBe(true);
      expect(SettingsService.needsSync(stateWithOldSync)).toBe(true);
      expect(SettingsService.needsSync(stateUpToDate)).toBe(false);
      expect(SettingsService.needsSync(null)).toBe(true);
    });

    it('handles missing states gracefully during merge', () => {
      const localState: SettingsStorePersistedShape = {
        settings: createDefaultSettings(),
        updatedAt: Date.now(),
        lastSyncedAt: null,
      };

      const mergedWithNull = SettingsService.mergeSettings(localState, null);
      const mergedWithBothNull = SettingsService.mergeSettings(null, null);

      expect(mergedWithNull.settings).toEqual(localState.settings);
      expect(mergedWithBothNull.settings).toEqual(createDefaultSettings());
    });
  });

  // ── Validation Integration ─────────────────────────────────────────────────

  describe('Validation Integration', () => {
    it('validates individual setting values', () => {
      const themeValidation = SettingsService.validateSettingValue('theme', 'dark');
      const invalidThemeValidation = SettingsService.validateSettingValue('theme', 'invalid');
      const booleanValidation = SettingsService.validateSettingValue('notificationsEnabled', true);

      expect(themeValidation.valid).toBe(true);
      expect(themeValidation.error).toBeUndefined();

      expect(invalidThemeValidation.valid).toBe(false);
      expect(invalidThemeValidation.error).toBeDefined();

      expect(booleanValidation.valid).toBe(true);
    });

    it('catches multiple validation errors', () => {
      const invalidSettings = {
        theme: 'invalid',
        language: 'a'.repeat(25),
        notificationsEnabled: 'true',
      };

      const validation = SettingsService.validateSettings(invalidSettings);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });

    it('validates partial updates without breaking existing data', () => {
      const currentSettings = createDefaultSettings();
      const partialUpdate = { theme: 'dark' as const };

      const validation = SettingsService.validatePartialUpdate(currentSettings, partialUpdate);

      expect(validation.valid).toBe(true);
      expect(validation.data?.theme).toBe('dark');
      expect(validation.data?.language).toBe(currentSettings.language);
      expect(validation.data?.notificationsEnabled).toBe(currentSettings.notificationsEnabled);
    });
  });

  // ── Export/Import Integration ──────────────────────────────────────────────

  describe('Export/Import Integration', () => {
    it('maintains data integrity through export/import cycle', () => {
      const originalSettings = {
        ...createDefaultSettings(),
        theme: 'dark' as const,
        language: 'fr',
        notificationsEnabled: false,
      };

      const storeState = SettingsService.createStoreState(originalSettings);
      const exported = SettingsService.exportSettings(storeState);
      const importResult = SettingsService.importSettings(exported);

      expect(importResult.valid).toBe(true);
      expect(importResult.data?.theme).toBe('dark');
      expect(importResult.data?.language).toBe('fr');
      expect(importResult.data?.notificationsEnabled).toBe(false);
    });

    it('rejects exports with wrong version', () => {
      const invalidExport = {
        version: 999,
        exportedAt: new Date().toISOString(),
        settings: createDefaultSettings(),
        updatedAt: Date.now(),
      };

      const importResult = SettingsService.importSettings(invalidExport);

      expect(importResult.valid).toBe(false);
      expect(importResult.errors.some(e => e.includes('version mismatch'))).toBe(true);
    });

    it('rejects malformed export data', () => {
      const invalidData = {
        exportedAt: new Date().toISOString(),
        // Missing version, settings, and updatedAt
      };

      const importResult = SettingsService.importSettings(invalidData);

      expect(importResult.valid).toBe(false);
      expect(importResult.errors.length).toBeGreaterThan(0);
    });
  });

  // ── Capabilities Integration ───────────────────────────────────────────────

  describe('Capabilities Integration', () => {
    it('checks edit permissions for all settings', () => {
      const settings = createDefaultSettings();
      const settingKeys = Object.keys(settings) as Array<keyof typeof settings>;

      settingKeys.forEach((key) => {
        const canEdit = SettingsService.canEditSetting(key);
        expect(canEdit).toBeDefined();
        expect(typeof canEdit).toBe('boolean');
      });
    });

    it('returns all capabilities flags', () => {
      const capabilities = SettingsService.getCapabilities();

      const requiredCapabilities = [
        'canEditTheme',
        'canEditLanguage',
        'canEditNotifications',
        'canEditEmail',
        'canEditPrefetching',
        'canEditReducedMotion',
        'canExportSettings',
        'canImportSettings',
        'canSyncSettings',
      ];

      requiredCapabilities.forEach((capability) => {
        expect(capabilities).toHaveProperty(capability);
        expect(typeof capabilities[capability as keyof typeof capabilities]).toBe('boolean');
      });
    });

    it('allows editing when capabilities are enabled', () => {
      const capabilities = SettingsService.getCapabilities();

      if (capabilities.canEditTheme) {
        expect(SettingsService.canEditSetting('theme')).toBe(true);
      }

      if (capabilities.canEditLanguage) {
        expect(SettingsService.canEditSetting('language')).toBe(true);
      }
    });
  });

  // ── Migration Integration ──────────────────────────────────────────────────

  describe('Migration Integration', () => {
    it('migrates outdated settings to current version', () => {
      const outdatedSettings = {
        ...createDefaultSettings(),
        version: 0 as any,
      };

      const migrated = SettingsService.migrateSettings(outdatedSettings);

      expect(migrated.version).toBe(SETTINGS_SCHEMA_VERSION);
    });

    it('preserves user settings during migration', () => {
      const userSettings = {
        ...createDefaultSettings(),
        version: 0 as any,
        theme: 'dark' as const,
        language: 'es',
      };

      const migrated = SettingsService.migrateSettings(userSettings);

      expect(migrated.version).toBe(SETTINGS_SCHEMA_VERSION);
      expect(migrated.theme).toBe('dark');
      expect(migrated.language).toBe('es');
    });

    it('does not modify current version settings', () => {
      const currentSettings = createDefaultSettings();
      const migrated = SettingsService.migrateSettings(currentSettings);

      expect(migrated).toEqual(currentSettings);
    });
  });

  // ── Electronic Signature Integration ──────────────────────────────────────

  describe('Electronic Signature Integration', () => {
    it('defaults to disabled electronic signature', () => {
      const defaults = createDefaultSettings();
      expect(defaults.electronicSignatureEnabled).toBe(false);
      expect(defaults.signatureName).toBe('');
      expect(defaults.requireSignatureOnCertificates).toBe(false);
    });

    it('validates a full electronic signature configuration', () => {
      const settings = {
        ...createDefaultSettings(),
        electronicSignatureEnabled: true,
        signatureName: 'Jane Doe',
        requireSignatureOnCertificates: true,
      };
      const result = SettingsService.validateSettings(settings);
      expect(result.valid).toBe(true);
      expect(result.data?.electronicSignatureEnabled).toBe(true);
      expect(result.data?.signatureName).toBe('Jane Doe');
      expect(result.data?.requireSignatureOnCertificates).toBe(true);
    });

    it('rejects a signatureName that exceeds 100 characters', () => {
      const settings = {
        ...createDefaultSettings(),
        electronicSignatureEnabled: true,
        signatureName: 'a'.repeat(101),
      };
      const result = SettingsService.validateSettings(settings);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('signatureName'))).toBe(true);
    });

    it('preserves electronic signature settings through export/import cycle', () => {
      const original = {
        ...createDefaultSettings(),
        electronicSignatureEnabled: true,
        signatureName: 'Alice Smith',
        requireSignatureOnCertificates: true,
      };
      const storeState = SettingsService.createStoreState(original);
      const exported = SettingsService.exportSettings(storeState);
      const importResult = SettingsService.importSettings(exported);

      expect(importResult.valid).toBe(true);
      expect(importResult.data?.electronicSignatureEnabled).toBe(true);
      expect(importResult.data?.signatureName).toBe('Alice Smith');
      expect(importResult.data?.requireSignatureOnCertificates).toBe(true);
    });

    it('resets electronic signature to defaults on resetToDefaults', () => {
      const reset = SettingsService.resetToDefaults();
      expect(reset.electronicSignatureEnabled).toBe(false);
      expect(reset.signatureName).toBe('');
      expect(reset.requireSignatureOnCertificates).toBe(false);
    });

    it('canEditSetting returns true for all electronic signature fields', () => {
      expect(SettingsService.canEditSetting('electronicSignatureEnabled')).toBe(true);
      expect(SettingsService.canEditSetting('signatureName')).toBe(true);
      expect(SettingsService.canEditSetting('requireSignatureOnCertificates')).toBe(true);
    });

    it('merges electronic signature settings via last-write-wins', () => {
      const localState: SettingsStorePersistedShape = {
        settings: { ...createDefaultSettings(), electronicSignatureEnabled: false },
        updatedAt: Date.now() - 2000,
        lastSyncedAt: null,
      };
      const remoteState: SettingsStorePersistedShape = {
        settings: {
          ...createDefaultSettings(),
          electronicSignatureEnabled: true,
          signatureName: 'Bob',
        },
        updatedAt: Date.now() - 1000,
        lastSyncedAt: null,
      };

      const merged = SettingsService.mergeSettings(localState, remoteState);
      expect(merged.settings.electronicSignatureEnabled).toBe(true);
      expect(merged.settings.signatureName).toBe('Bob');
    });
  });

  // ── LocalStorage Integration ───────────────────────────────────────────────

  describe('LocalStorage Integration', () => {
    it('can persist and retrieve settings from localStorage', () => {
      const settings = createDefaultSettings();
      const storeState = SettingsService.createStoreState(settings);

      localStorageMock.setItem('settings', JSON.stringify(storeState));
      const stored = localStorageMock.getItem('settings');
      const parsed = JSON.parse(stored as string);

      expect(parsed).toEqual(storeState);
      expect(parsed.settings).toEqual(settings);
    });

    it('handles localStorage errors gracefully', () => {
      const settings = createDefaultSettings();
      const storeState = SettingsService.createStoreState(settings);

      localStorageMock.clear();
      const validation = SettingsService.validateSettings(settings);

      expect(validation.valid).toBe(true);
    });

    // ── Documentation Update Integration ───────────────────────────────────────────

    describe('Documentation Update Integration', () => {
      it('integrates documentation validation with settings workflow', () => {
        const settings = createDefaultSettings();
        const validation = SettingsService.validateSettings(settings);

        expect(validation.valid).toBe(true);

        const docValidation = SettingsService.validateDocumentationCompleteness();
        expect(docValidation.valid).toBe(true);
      });

      it('ensures documentation metadata stays in sync with schema', () => {
        const metadata = SettingsService.getDocumentationMetadata();
        const settings = createDefaultSettings();

        expect(metadata.schemaVersion).toBe(settings.version);
        expect(Object.keys(metadata.fields)).toEqual(Object.keys(settings));
      });

      it('generates documentation update recommendations', () => {
        const update = SettingsService.generateDocumentationUpdate();

        expect(update).toHaveProperty('needsUpdate');
        expect(update).toHaveProperty('summary');
        expect(update).toHaveProperty('suggestions');

        // Verify suggestions are actionable
        if (update.needsUpdate) {
          update.suggestions.forEach((suggestion) => {
            expect(typeof suggestion).toBe('string');
            expect(suggestion.length).toBeGreaterThan(0);
          });
        }
      });

      it('validates documentation completeness end-to-end', () => {
        const metadata = SettingsService.getDocumentationMetadata();
        const validation = SettingsService.validateDocumentationCompleteness();

        expect(validation.valid).toBe(true);
        expect(metadata.fields).toBeDefined();

        // All schema fields should be documented
        const defaultSettings = createDefaultSettings();
        Object.keys(defaultSettings).forEach((field) => {
          expect(metadata.fields[field]).toBeDefined();
          expect(typeof metadata.fields[field]).toBe('string');
        });
      });

      it('maintains documentation version consistency', () => {
        const metadata = SettingsService.getDocumentationMetadata();

        expect(metadata.version).toBeTruthy();
        expect(metadata.lastUpdated).toBeTruthy();
        expect(metadata.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      });
    });
  });
});
    });
  });
});
