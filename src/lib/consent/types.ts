import { z } from 'zod';
import { CONSENT_POLICY_VERSION, CONSENT_SCHEMA_VERSION } from './constants';

/**
 * Granular cookie categories following IAB TCF conventions.
 * - `necessary`   — Always on; required for the site to function.
 * - `analytics`   — Usage analytics (e.g. Google Analytics).
 * - `functional`  — Enhanced UX features (e.g. saved preferences beyond necessary).
 * - `marketing`   — Advertising and cross-site tracking.
 */
export const cookieCategorySchema = z.enum(['necessary', 'analytics', 'functional', 'marketing']);
export type CookieCategory = z.infer<typeof cookieCategorySchema>;

export const consentPreferencesSchema = z.object({
  necessary: z.literal(true), // always required
  analytics: z.boolean(),
  functional: z.boolean(),
  marketing: z.boolean(),
});
export type ConsentPreferences = z.infer<typeof consentPreferencesSchema>;

export const consentStateSchema = z.object({
  version: z.literal(CONSENT_SCHEMA_VERSION),
  /** Whether the user has made an explicit choice (accepted or customised). */
  decided: z.boolean(),
  preferences: consentPreferencesSchema,
  /** Unix ms timestamp of when consent was last recorded. */
  decidedAt: z.number().nullable(),
  /** Consent policy version in effect when the decision was recorded. */
  acceptedPolicyVersion: z.number().int().min(1),
});
export type ConsentState = z.infer<typeof consentStateSchema>;

/** Default: only necessary cookies, no decision made yet. */
export function createDefaultConsentState(): ConsentState {
  return {
    version: CONSENT_SCHEMA_VERSION,
    decided: false,
    preferences: {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    },
    decidedAt: null,
    acceptedPolicyVersion: CONSENT_POLICY_VERSION,
  };
}

/** Accept all categories. */
export function createAcceptAllPreferences(): ConsentPreferences {
  return { necessary: true, analytics: true, functional: true, marketing: true };
}
