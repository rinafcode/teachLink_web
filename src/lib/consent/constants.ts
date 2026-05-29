export const CONSENT_SCHEMA_VERSION = 1 as const;

/** localStorage key for persisted consent state */
export const CONSENT_STORAGE_KEY = 'teachlink-cookie-consent-v1';

/** Cookie name written server-side for SSR-aware consent checks */
export const CONSENT_COOKIE_NAME = 'cookie-consent';

/** How long (ms) before consent is considered stale and re-prompted (1 year) */
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;
