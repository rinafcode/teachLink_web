'use client';

/**
 * @module consent/store
 *
 * Zustand store for cookie consent preferences.
 * Persisted to localStorage; syncs a summary cookie for SSR-aware checks.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CONSENT_COOKIE_NAME, CONSENT_STORAGE_KEY, CONSENT_TTL_MS } from './constants';
import {
  type ConsentPreferences,
  type ConsentState,
  consentStateSchema,
  createAcceptAllPreferences,
  createDefaultConsentState,
} from './types';

interface ConsentStoreActions {
  /** Accept all cookie categories. */
  acceptAll: () => void;
  /** Reject all optional categories (only necessary remains). */
  rejectAll: () => void;
  /** Save a custom set of preferences. */
  savePreferences: (prefs: Partial<Omit<ConsentPreferences, 'necessary'>>) => void;
  /** Returns true if consent is still valid (within TTL). */
  isConsentValid: () => boolean;
}

interface ConsentSlice extends ConsentState, ConsentStoreActions {}

const noopStorage = {
  getItem: (): string | null => null,
  setItem: (): void => undefined,
  removeItem: (): void => undefined,
};

function localStorageOrNoop() {
  if (typeof window === 'undefined') return noopStorage;
  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

/** Write a lightweight summary cookie so middleware/SSR can read consent without JS. */
function syncConsentCookie(decided: boolean, analytics: boolean) {
  if (typeof document === 'undefined') return;
  const value = decided ? (analytics ? 'full' : 'necessary') : 'pending';
  const maxAge = CONSENT_TTL_MS / 1000;
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function recordDecision(
  set: (partial: Partial<ConsentSlice>) => void,
  preferences: ConsentPreferences,
) {
  const decidedAt = Date.now();
  const parsed = consentStateSchema.safeParse({
    version: 1,
    decided: true,
    preferences,
    decidedAt,
  });
  if (!parsed.success) return;
  set(parsed.data);
  syncConsentCookie(true, preferences.analytics);
}

export const useConsentStore = create<ConsentSlice>()(
  persist(
    (set, get) => ({
      ...createDefaultConsentState(),

      acceptAll: () => recordDecision(set, createAcceptAllPreferences()),

      rejectAll: () =>
        recordDecision(set, {
          necessary: true,
          analytics: false,
          functional: false,
          marketing: false,
        }),

      savePreferences: (prefs) => {
        const current = get().preferences;
        recordDecision(set, { ...current, ...prefs, necessary: true });
      },

      isConsentValid: () => {
        const { decided, decidedAt } = get();
        if (!decided || decidedAt === null) return false;
        return Date.now() - decidedAt < CONSENT_TTL_MS;
      },
    }),
    {
      name: CONSENT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorageOrNoop()),
      partialize: (state) => ({
        version: state.version,
        decided: state.decided,
        preferences: state.preferences,
        decidedAt: state.decidedAt,
      }),
    },
  ),
);
