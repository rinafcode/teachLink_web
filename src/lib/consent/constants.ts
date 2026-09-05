export const CONSENT_SCHEMA_VERSION = 1 as const;

/**
 * Version of the consent policy shown to users. Bump this when the wording or
 * the set of collected categories changes so that users who accepted an older
 * policy are re-prompted on their next visit.
 */
export const CONSENT_POLICY_VERSION = 1 as const;

/** localStorage key for persisted consent state */
export const CONSENT_STORAGE_KEY = 'teachlink-cookie-consent-v1';

/** Cookie name written server-side for SSR-aware consent checks */
export const CONSENT_COOKIE_NAME = 'cookie-consent';

/** How long (ms) before consent is considered stale and re-prompted (1 year) */
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;
