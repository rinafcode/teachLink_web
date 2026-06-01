/**
 * User Settings Service
 * Business logic layer for settings operations
 */

import {
  AppSettings,
  SettingsStorePersistedShape,
  createDefaultSettings,
  appSettingsSchema,
} from './types';
import { SETTINGS_SCHEMA_VERSION } from './constants';

export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
  data?: AppSettings;
}

export interface SettingsSyncResult {
  success: boolean;
  message: string;
  data?: SettingsStorePersistedShape;
  conflict?: boolean;
}

export class SettingsService {
  /**
   * Validate settings data against the schema
   */
  static validateSettings(data: unknown): SettingsValidationResult {
    const errors: string[] = [];

    try {
      const parsed = appSettingsSchema.safeParse(data);

      if (!parsed.success) {
        parsed.error.errors.forEach((err: any) => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
        return {
          valid: false,
          errors,
        };
      }

      return {
        valid: true,
        errors: [],
        data: parsed.data,
      };
    } catch (error) {
      errors.push('Unexpected validation error');
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Create a complete settings store state with timestamps
   */
  static createStoreState(settings: AppSettings): SettingsStorePersistedShape {
    return {
      settings,
      updatedAt: Date.now(),
      lastSyncedAt: null,
    };
  }

  /**
   * Merge remote settings with local settings using last-write-wins based on timestamps
   */
  static mergeSettings(
    localState: SettingsStorePersistedShape | null,
    remoteState: SettingsStorePersistedShape | null,
  ): SettingsStorePersistedShape {
    const localSettings = localState?.settings || createDefaultSettings();
    const remoteSettings = remoteState?.settings || createDefaultSettings();
    const localTimestamp = localState?.updatedAt || 0;
    const remoteTimestamp = remoteState?.updatedAt || 0;

    // Use the most recent settings
    const mergedSettings = remoteTimestamp > localTimestamp ? remoteSettings : localSettings;
    const mergedTimestamp = Math.max(localTimestamp, remoteTimestamp);

    return {
      settings: mergedSettings,
      updatedAt: mergedTimestamp,
      lastSyncedAt: Date.now(),
    };
  }

  /**
   * Check if settings need to be synced with remote
   */
  static needsSync(localState: SettingsStorePersistedShape | null): boolean {
    if (!localState) return true;
    if (!localState.lastSyncedAt) return true;

    // Sync if local changes were made after last sync
    return localState.updatedAt > localState.lastSyncedAt;
  }

  /**
   * Validate partial settings update
   */
  static validatePartialUpdate(
    currentSettings: AppSettings,
    partialUpdate: Partial<AppSettings>,
  ): SettingsValidationResult {
    const mergedSettings = { ...currentSettings, ...partialUpdate };
    return this.validateSettings(mergedSettings);
  }

  /**
   * Check if a specific setting is valid
   */
  static validateSettingValue(
    key: keyof AppSettings,
    value: unknown,
  ): { valid: boolean; error?: string } {
    try {
      const partialSettings = { ...createDefaultSettings(), [key]: value };
      const result = this.validateSettings(partialSettings);

      if (result.valid) {
        return { valid: true };
      }

      return {
        valid: false,
        error: result.errors.find((e) => e.includes(String(key))) || 'Invalid value',
      };
    } catch {
      return {
        valid: false,
        error: 'Validation error',
      };
    }
  }

  /**
   * Export settings with metadata for backup/restore
   */
  static exportSettings(state: SettingsStorePersistedShape): {
    version: number;
    exportedAt: string;
    settings: AppSettings;
    updatedAt: number;
  } {
    return {
      version: SETTINGS_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      updatedAt: state.updatedAt,
    };
  }

  /**
   * Import settings from exported data with validation
   */
  static importSettings(data: unknown): SettingsValidationResult {
    try {
      // Validate the structure
      if (typeof data !== 'object' || data === null) {
        return {
          valid: false,
          errors: ['Invalid import data format'],
        };
      }

      const importData = data as {
        version?: number;
        exportedAt?: string;
        settings?: unknown;
        updatedAt?: number;
      };

      // Check version compatibility
      if (importData.version && importData.version !== SETTINGS_SCHEMA_VERSION) {
        return {
          valid: false,
          errors: [
            `Settings version mismatch. Expected v${SETTINGS_SCHEMA_VERSION}, got v${importData.version}`,
          ],
        };
      }

      // Validate settings
      if (!importData.settings) {
        return {
          valid: false,
          errors: ['Missing settings data'],
        };
      }

      const validation = this.validateSettings(importData.settings);
      if (!validation.valid) {
        return validation;
      }

      return {
        valid: true,
        errors: [],
        data: validation.data,
      };
    } catch {
      return {
        valid: false,
        errors: ['Import failed due to unexpected error'],
      };
    }
  }

  /**
   * Reset settings to defaults while preserving version
   */
  static resetToDefaults(): AppSettings {
    return createDefaultSettings();
  }

  /**
   * Get settings capabilities based on user role/permissions
   */
  static getCapabilities(): {
    canEditTheme: boolean;
    canEditLanguage: boolean;
    canEditNotifications: boolean;
    canEditEmail: boolean;
    canEditPrefetching: boolean;
    canEditReducedMotion: boolean;
    canEditElectronicSignature: boolean;
    canEditPollSettings: boolean;
    canExportSettings: boolean;
    canImportSettings: boolean;
    canSyncSettings: boolean;
  } {
    return {
      canEditTheme: true,
      canEditLanguage: true,
      canEditNotifications: true,
      canEditEmail: true,
      canEditPrefetching: true,
      canEditReducedMotion: true,
      canEditElectronicSignature: true,
      canEditPollSettings: true,
      canExportSettings: true,
      canImportSettings: true,
      canSyncSettings: true,
    };
  }

  /**
   * Check if user has permission to modify a specific setting
   */
  static canEditSetting(key: keyof AppSettings): boolean {
    const capabilities = this.getCapabilities();

    const permissionMap: Record<keyof AppSettings, keyof typeof capabilities> = {
      version: 'canEditTheme', // Version is system-managed
      theme: 'canEditTheme',
      language: 'canEditLanguage',
      notificationsEnabled: 'canEditNotifications',
      emailNotifications: 'canEditEmail',
      prefetchingEnabled: 'canEditPrefetching',
      reducedMotion: 'canEditReducedMotion',
      electronicSignatureEnabled: 'canEditElectronicSignature',
      signatureName: 'canEditElectronicSignature',
      requireSignatureOnCertificates: 'canEditElectronicSignature',
      pollCreationEnabled: 'canEditPollSettings',
      defaultPollDuration: 'canEditPollSettings',
      allowAnonymousVoting: 'canEditPollSettings',
      pollResultsVisibility: 'canEditPollSettings',
    };

    return capabilities[permissionMap[key]] || false;
  }

  /**
   * Apply settings migration if needed (for future version changes)
   */
  static migrateSettings(settings: AppSettings): AppSettings {
    // If settings version is outdated, apply migrations
    if (settings.version !== SETTINGS_SCHEMA_VERSION) {
      // Migration from version 2 to version 3: Add virtual background fields
      if (settings.version === 2) {
        return {
          ...settings,
          version: SETTINGS_SCHEMA_VERSION,
          virtualBackgroundEnabled: false,
          virtualBackgroundType: 'none',
          virtualBackgroundImage: '',
          virtualBackgroundBlur: 10,
          virtualBackgroundColor: '#000000',
        };
      }

      // For other version mismatches, use defaults but preserve existing fields
      return {
        ...createDefaultSettings(),
        ...settings,
        version: SETTINGS_SCHEMA_VERSION,
      };
    }

    return settings;
  }
}
