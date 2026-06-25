export const SETTINGS_SCHEMA_VERSION = 3 as const;

/** Documentation version tracking for settings features */
export const SETTINGS_DOCUMENTATION_VERSION = '1.0.0' as const;

/** Zustand persist key for local persistence */
export const SETTINGS_STORAGE_KEY = 'teachlink-app-settings-v3';

/** Stable ID for anonymous sync across sessions on same browser */
export const ANONYMOUS_SETTINGS_USER_KEY = 'teachlink-anonymous-sync-user-id';
