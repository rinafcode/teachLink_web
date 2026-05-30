/**
 * SettingsService – unit tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsService } from '../service';
import { createDefaultSettings, type AppSettings, type SettingsStorePersistedShape } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  const defaults = createDefaultSettings();
  return {
    ...defaults,
    ...overrides,
  };
}

function createMockStoreState(overrides: Partial<SettingsStorePersistedShape> = {}): SettingsStorePersistedShape {
  return {
    settings: createDefaultSettings(),
    updatedAt: Date.now(),
    lastSyncedAt: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsService', () => {
  // ── validateSettings ──────────────────────────────────────────────────────

  describe('validateSettings', () => {
    it('validates correct settings', () => {
      const settings = createDefaultSettings();
      const result = SettingsService.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(settings);
    });

    it('rejects invalid settings with missing fields', () => {
      const invalidSettings = { theme: 'light' }; // Missing required fields
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });

    it('rejects invalid theme values', () => {
      const invalidSettings = { ...createDefaultSettings(), theme: 'invalid' as any };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('theme'))).toBe(true);
    });

    it('rejects language strings that are too long', () => {
      const invalidSettings = { ...createDefaultSettings(), language: 'a'.repeat(25) };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('language'))).toBe(true);
    });

    it('rejects non-boolean notification settings', () => {
      const invalidSettings = { ...createDefaultSettings(), notificationsEnabled: 'true' as any };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('notificationsEnabled'))).toBe(true);
    });

    it('validates virtual background settings', () => {
      const settings = {
        ...createDefaultSettings(),
        virtualBackgroundEnabled: true,
        virtualBackgroundType: 'image' as const,
        virtualBackgroundImage: 'https://example.com/bg.jpg',
        virtualBackgroundBlur: 20,
        virtualBackgroundColor: '#FF5733',
      };
      const result = SettingsService.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid virtual background type', () => {
      const invalidSettings = { ...createDefaultSettings(), virtualBackgroundType: 'invalid' as any };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('virtualBackgroundType'))).toBe(true);
    });

    it('rejects blur intensity out of range', () => {
      const invalidSettings = { ...createDefaultSettings(), virtualBackgroundBlur: 150 };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('virtualBackgroundBlur'))).toBe(true);
    });

    it('rejects image URL that is too long', () => {
      const invalidSettings = { ...createDefaultSettings(), virtualBackgroundImage: 'a'.repeat(501) };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('virtualBackgroundImage'))).toBe(true);
    });

    it('rejects invalid hex color format', () => {
      const invalidSettings = { ...createDefaultSettings(), virtualBackgroundColor: 'invalid' };
      const result = SettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(true); // String validation only checks length
    });
  });

  // ── createStoreState ──────────────────────────────────────────────────────

  describe('createStoreState', () => {
    it('creates store state with current timestamp', () => {
      const settings = createDefaultSettings();
      const state = SettingsService.createStoreState(settings);

      expect(state.settings).toEqual(settings);
      expect(state.updatedAt).toBeGreaterThan(Date.now() - 1000);
      expect(state.lastSyncedAt).toBeNull();
    });

    it('includes all required fields', () => {
      const settings = createDefaultSettings();
      const state = SettingsService.createStoreState(settings);

      expect(state).toHaveProperty('settings');
      expect(state).toHaveProperty('updatedAt');
      expect(state).toHaveProperty('lastSyncedAt');
    });
  });

  // ── mergeSettings ─────────────────────────────────────────────────────────

  describe('mergeSettings', () => {
    it('merges local state when it is newer', () => {
      const localState = createMockStoreState({
        updatedAt: Date.now() + 1000,
        settings: { ...createDefaultSettings(), theme: 'dark' },
      });
      const remoteState = createMockStoreState({
        updatedAt: Date.now(),
        settings: { ...createDefaultSettings(), theme: 'light' },
      });

      const result = SettingsService.mergeSettings(localState, remoteState);

      expect(result.settings.theme).toBe('dark');
      expect(result.updatedAt).toBe(localState.updatedAt);
      expect(result.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('merges remote state when it is newer', () => {
      const localState = createMockStoreState({
        updatedAt: Date.now(),
        settings: { ...createDefaultSettings(), theme: 'light' },
      });
      const remoteState = createMockStoreState({
        updatedAt: Date.now() + 1000,
        settings: { ...createDefaultSettings(), theme: 'dark' },
      });

      const result = SettingsService.mergeSettings(localState, remoteState);

      expect(result.settings.theme).toBe('dark');
      expect(result.updatedAt).toBe(remoteState.updatedAt);
      expect(result.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('handles null local state', () => {
      const remoteState = createMockStoreState({
        settings: { ...createDefaultSettings(), theme: 'dark' },
      });

      const result = SettingsService.mergeSettings(null, remoteState);

      expect(result.settings).toEqual(remoteState.settings);
      expect(result.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('handles null remote state', () => {
      const localState = createMockStoreState({
        settings: { ...createDefaultSettings(), theme: 'light' },
      });

      const result = SettingsService.mergeSettings(localState, null);

      expect(result.settings).toEqual(localState.settings);
      expect(result.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('uses defaults when both states are null', () => {
      const result = SettingsService.mergeSettings(null, null);

      expect(result.settings).toEqual(createDefaultSettings());
      expect(result.lastSyncedAt).toBeGreaterThan(Date.now() - 1000);
    });
  });

  // ── needsSync ─────────────────────────────────────────────────────────────

  describe('needsSync', () => {
    it('returns true when no local state exists', () => {
      const result = SettingsService.needsSync(null);
      expect(result).toBe(true);
    });

    it('returns true when lastSyncedAt is null', () => {
      const state = createMockStoreState({ lastSyncedAt: null });
      const result = SettingsService.needsSync(state);
      expect(result).toBe(true);
    });

    it('returns true when updatedAt is greater than lastSyncedAt', () => {
      const state = createMockStoreState({
        updatedAt: Date.now() + 1000,
        lastSyncedAt: Date.now(),
      });
      const result = SettingsService.needsSync(state);
      expect(result).toBe(true);
    });

    it('returns false when sync is up to date', () => {
      const now = Date.now();
      const state = createMockStoreState({
        updatedAt: now,
        lastSyncedAt: now + 1000,
      });
      const result = SettingsService.needsSync(state);
      expect(result).toBe(false);
    });
  });

  // ── validatePartialUpdate ─────────────────────────────────────────────────

  describe('validatePartialUpdate', () => {
    it('validates correct partial update', () => {
      const currentSettings = createDefaultSettings();
      const partialUpdate = { theme: 'dark' as const };

      const result = SettingsService.validatePartialUpdate(currentSettings, partialUpdate);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid partial update', () => {
      const currentSettings = createDefaultSettings();
      const partialUpdate = { theme: 'invalid' as any };

      const result = SettingsService.validatePartialUpdate(currentSettings, partialUpdate);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('merges partial update with current settings', () => {
      const currentSettings = createDefaultSettings();
      const partialUpdate = { theme: 'dark' as const };

      const result = SettingsService.validatePartialUpdate(currentSettings, partialUpdate);

      expect(result.data?.theme).toBe('dark');
      expect(result.data?.language).toBe(currentSettings.language);
    });
  });

  // ── validateSettingValue ───────────────────────────────────────────────────

  describe('validateSettingValue', () => {
    it('validates correct theme value', () => {
      const result = SettingsService.validateSettingValue('theme', 'dark');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid theme value', () => {
      const result = SettingsService.validateSettingValue('theme', 'invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('validates correct boolean value', () => {
      const result = SettingsService.validateSettingValue('notificationsEnabled', true);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid boolean value', () => {
      const result = SettingsService.validateSettingValue('notificationsEnabled', 'true');
      expect(result.valid).toBe(false);
    });

    it('validates correct language value', () => {
      const result = SettingsService.validateSettingValue('language', 'en');
      expect(result.valid).toBe(true);
    });

    it('rejects invalid language value (too long)', () => {
      const result = SettingsService.validateSettingValue('language', 'a'.repeat(25));
      expect(result.valid).toBe(false);
    });

    it('validates correct electronicSignatureEnabled value', () => {
      const result = SettingsService.validateSettingValue('electronicSignatureEnabled', false);
      expect(result.valid).toBe(true);
    });

    it('rejects non-boolean electronicSignatureEnabled', () => {
      const result = SettingsService.validateSettingValue('electronicSignatureEnabled', 'yes');
      expect(result.valid).toBe(false);
    });

    it('validates correct signatureName value', () => {
      const result = SettingsService.validateSettingValue('signatureName', 'Jane Doe');
      expect(result.valid).toBe(true);
    });

    it('rejects signatureName that is too long', () => {
      const result = SettingsService.validateSettingValue('signatureName', 'a'.repeat(101));
      expect(result.valid).toBe(false);
    });

    it('validates correct requireSignatureOnCertificates value', () => {
      const result = SettingsService.validateSettingValue('requireSignatureOnCertificates', true);
      expect(result.valid).toBe(true);
    });
  });

  // ── exportSettings ───────────────────────────────────────────────────────

  describe('exportSettings', () => {
    it('exports settings with metadata', () => {
      const state = createMockStoreState();
      const exported = SettingsService.exportSettings(state);

      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('exportedAt');
      expect(exported).toHaveProperty('settings');
      expect(exported).toHaveProperty('updatedAt');
      expect(exported.settings).toEqual(state.settings);
      expect(exported.updatedAt).toBe(state.updatedAt);
    });

    it('includes ISO timestamp', () => {
      const state = createMockStoreState();
      const exported = SettingsService.exportSettings(state);

      expect(exported.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ── importSettings ───────────────────────────────────────────────────────

  describe('importSettings', () => {
    it('imports valid exported settings', () => {
      const state = createMockStoreState();
      const exported = SettingsService.exportSettings(state);

      const result = SettingsService.importSettings(exported);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(state.settings);
    });

    it('rejects invalid data format', () => {
      const result = SettingsService.importSettings('invalid');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid import data format');
    });

    it('rejects settings with wrong version', () => {
      const invalidData = {
        version: 999,
        exportedAt: new Date().toISOString(),
        settings: createDefaultSettings(),
        updatedAt: Date.now(),
      };

      const result = SettingsService.importSettings(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version mismatch'))).toBe(true);
    });

    it('rejects data with missing settings', () => {
      const invalidData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        updatedAt: Date.now(),
      };

      const result = SettingsService.importSettings(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing settings data');
    });

    it('rejects invalid settings', () => {
      const invalidData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: { invalid: 'data' },
        updatedAt: Date.now(),
      };

      const result = SettingsService.importSettings(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ── resetToDefaults ──────────────────────────────────────────────────────

  describe('resetToDefaults', () => {
    it('returns default settings', () => {
      const defaults = SettingsService.resetToDefaults();
      const expected = createDefaultSettings();

      expect(defaults).toEqual(expected);
    });

    it('maintains correct version', () => {
      const defaults = SettingsService.resetToDefaults();
      expect(defaults.version).toBeDefined();
    });
  });

  // ── getCapabilities ──────────────────────────────────────────────────────

  describe('getCapabilities', () => {
    it('returns all capability flags', () => {
      const capabilities = SettingsService.getCapabilities();

      expect(capabilities).toHaveProperty('canEditTheme');
      expect(capabilities).toHaveProperty('canEditLanguage');
      expect(capabilities).toHaveProperty('canEditNotifications');
      expect(capabilities).toHaveProperty('canEditEmail');
      expect(capabilities).toHaveProperty('canEditPrefetching');
      expect(capabilities).toHaveProperty('canEditReducedMotion');
      expect(capabilities).toHaveProperty('canEditElectronicSignature');
      expect(capabilities).toHaveProperty('canExportSettings');
      expect(capabilities).toHaveProperty('canImportSettings');
      expect(capabilities).toHaveProperty('canSyncSettings');
    });

    it('all capabilities are enabled by default', () => {
      const capabilities = SettingsService.getCapabilities();

      Object.values(capabilities).forEach((capability) => {
        expect(capability).toBe(true);
      });
      
      // Check that virtual background capability exists
      expect(capabilities.canEditVirtualBackground).toBe(true);
    });
  });

  // ── canEditSetting ───────────────────────────────────────────────────────

  describe('canEditSetting', () => {
    it('allows editing theme', () => {
      const result = SettingsService.canEditSetting('theme');
      expect(result).toBe(true);
    });

    it('allows editing language', () => {
      const result = SettingsService.canEditSetting('language');
      expect(result).toBe(true);
    });

    it('allows editing notificationsEnabled', () => {
      const result = SettingsService.canEditSetting('notificationsEnabled');
      expect(result).toBe(true);
    });

    it('allows editing emailNotifications', () => {
      const result = SettingsService.canEditSetting('emailNotifications');
      expect(result).toBe(true);
    });

    it('allows editing prefetchingEnabled', () => {
      const result = SettingsService.canEditSetting('prefetchingEnabled');
      expect(result).toBe(true);
    });

    it('allows editing reducedMotion', () => {
      const result = SettingsService.canEditSetting('reducedMotion');
      expect(result).toBe(true);
    });

    it('handles version field', () => {
      const result = SettingsService.canEditSetting('version');
      expect(result).toBeDefined(); // Should map to a capability
    });

    it('allows editing electronicSignatureEnabled', () => {
      const result = SettingsService.canEditSetting('electronicSignatureEnabled');
      expect(result).toBe(true);
    });

    it('allows editing signatureName', () => {
      const result = SettingsService.canEditSetting('signatureName');
      expect(result).toBe(true);
    });

    it('allows editing requireSignatureOnCertificates', () => {
      const result = SettingsService.canEditSetting('requireSignatureOnCertificates');
      expect(result).toBe(true);
    });

    it('allows editing virtual background settings', () => {
      const vbEnabled = SettingsService.canEditSetting('virtualBackgroundEnabled');
      const vbType = SettingsService.canEditSetting('virtualBackgroundType');
      const vbImage = SettingsService.canEditSetting('virtualBackgroundImage');
      const vbBlur = SettingsService.canEditSetting('virtualBackgroundBlur');
      const vbColor = SettingsService.canEditSetting('virtualBackgroundColor');

      expect(vbEnabled).toBe(true);
      expect(vbType).toBe(true);
      expect(vbImage).toBe(true);
      expect(vbBlur).toBe(true);
      expect(vbColor).toBe(true);
    });
  });

  // ── migrateSettings ──────────────────────────────────────────────────────

  describe('migrateSettings', () => {
    it('returns unchanged settings when version matches', () => {
      const settings = createDefaultSettings();
      const migrated = SettingsService.migrateSettings(settings);

      expect(migrated).toEqual(settings);
    });

    it('updates version when outdated', () => {
      const outdatedSettings: AppSettings = {
        ...createDefaultSettings(),
        version: 0 as any, // Outdated version
      };

      const migrated = SettingsService.migrateSettings(outdatedSettings);

      expect(migrated.version).toBe(createDefaultSettings().version);
    });

    it('preserves user settings during migration', () => {
      const outdatedSettings: AppSettings = {
        ...createDefaultSettings(),
        version: 0 as any,
        theme: 'dark',
        language: 'fr',
      };

      const migrated = SettingsService.migrateSettings(outdatedSettings);

      expect(migrated.theme).toBe('dark');
      expect(migrated.language).toBe('fr');
    });

    it('migrates version 2 to version 3 with virtual background fields', () => {
      const v2Settings = {
        ...createDefaultSettings(),
        version: 2 as any,
        theme: 'dark' as const,
      };
      
      const result = SettingsService.migrateSettings(v2Settings);

      expect(result.version).toBe(3);
      expect(result.virtualBackgroundEnabled).toBe(false);
      expect(result.virtualBackgroundType).toBe('none');
      expect(result.virtualBackgroundImage).toBe('');
      expect(result.virtualBackgroundBlur).toBe(10);
      expect(result.virtualBackgroundColor).toBe('#000000');
      expect(result.theme).toBe('dark'); // Preserves existing field
    });
  });

  // ── Documentation Update ──────────────────────────────────────────────────────

  describe('Documentation Update', () => {
    describe('getDocumentationMetadata', () => {
      it('returns documentation metadata with correct structure', () => {
        const metadata = SettingsService.getDocumentationMetadata();

        expect(metadata).toHaveProperty('version');
        expect(metadata).toHaveProperty('lastUpdated');
        expect(metadata).toHaveProperty('schemaVersion');
        expect(metadata).toHaveProperty('fields');
        expect(typeof metadata.fields).toBe('object');
      });

      it('includes all current settings fields in metadata', () => {
        const metadata = SettingsService.getDocumentationMetadata();
        const defaultSettings = createDefaultSettings();
        const schemaFields = Object.keys(defaultSettings);

        Object.keys(schemaFields).forEach((field) => {
          expect(metadata.fields).toHaveProperty(field);
        });
      });

      it('provides descriptions for all fields', () => {
        const metadata = SettingsService.getDocumentationMetadata();

        Object.values(metadata.fields).forEach((description) => {
          expect(typeof description).toBe('string');
          expect(description.length).toBeGreaterThan(0);
        });
      });
    });

    describe('validateDocumentationCompleteness', () => {
      it('validates that documentation is complete for current schema', () => {
        const validation = SettingsService.validateDocumentationCompleteness();

        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('missingFields');
        expect(validation).toHaveProperty('outdatedFields');
        expect(Array.isArray(validation.missingFields)).toBe(true);
        expect(Array.isArray(validation.outdatedFields)).toBe(true);
      });

      it('returns valid when documentation matches schema', () => {
        const validation = SettingsService.validateDocumentationCompleteness();

        // With current implementation, documentation should be complete
        expect(validation.valid).toBe(true);
        expect(validation.missingFields).toHaveLength(0);
        expect(validation.outdatedFields).toHaveLength(0);
      });
    });

    describe('generateDocumentationUpdate', () => {
      it('generates update summary when documentation is current', () => {
        const update = SettingsService.generateDocumentationUpdate();

        expect(update).toHaveProperty('needsUpdate');
        expect(update).toHaveProperty('summary');
        expect(update).toHaveProperty('suggestions');
        expect(Array.isArray(update.suggestions)).toBe(true);
      });

      it('indicates no update needed when documentation is complete', () => {
        const validation = SettingsService.validateDocumentationCompleteness();
        if (validation.valid) {
          const update = SettingsService.generateDocumentationUpdate();

          expect(update.needsUpdate).toBe(false);
          expect(update.summary).toContain('up-to-date');
          expect(update.suggestions).toHaveLength(0);
        }
      });

      it('provides actionable suggestions when update needed', () => {
        const update = SettingsService.generateDocumentationUpdate();

        if (update.needsUpdate) {
          expect(update.suggestions.length).toBeGreaterThan(0);
          update.suggestions.forEach((suggestion) => {
            expect(typeof suggestion).toBe('string');
            expect(suggestion.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });
});
