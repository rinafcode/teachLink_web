import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  CONSENT_TTL_MS,
} from '../constants';
import { useConsentStore } from '../store';
import {
  createAcceptAllPreferences,
  createDefaultConsentState,
} from '../types';

function clearAllCookies() {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

function acceptUnderPolicy() {
  useConsentStore.getState().acceptAll();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
  useConsentStore.setState(createDefaultConsentState());
});

describe('consent versioning', () => {
  it('defaults the accepted policy version to the current one', () => {
    expect(useConsentStore.getState().acceptedPolicyVersion).toBe(
      CONSENT_POLICY_VERSION,
    );
  });

  it('records the accepted policy version on accept all', () => {
    acceptUnderPolicy();
    const state = useConsentStore.getState();
    expect(state.decided).toBe(true);
    expect(state.acceptedPolicyVersion).toBe(CONSENT_POLICY_VERSION);
    expect(state.decidedAt).not.toBeNull();
  });

  it('records the accepted policy version on custom preferences', () => {
    useConsentStore.getState().savePreferences({ analytics: true });
    expect(useConsentStore.getState().acceptedPolicyVersion).toBe(
      CONSENT_POLICY_VERSION,
    );
  });
});

describe('isConsentValid / policy change', () => {
  it('returns true for a fresh decision under the current policy', () => {
    acceptUnderPolicy();
    expect(useConsentStore.getState().isConsentValid()).toBe(true);
  });

  it('returns false when consent was decided under an older policy', () => {
    acceptUnderPolicy();
    useConsentStore.setState({
      acceptedPolicyVersion: CONSENT_POLICY_VERSION - 1,
    });
    expect(useConsentStore.getState().isConsentValid()).toBe(false);
  });

  it('returns false when the decision is older than the TTL', () => {
    useConsentStore.setState({
      decided: true,
      decidedAt: Date.now() - (CONSENT_TTL_MS + 1),
      acceptedPolicyVersion: CONSENT_POLICY_VERSION,
      preferences: createAcceptAllPreferences(),
    });
    expect(useConsentStore.getState().isConsentValid()).toBe(false);
  });

  it('returns false before any decision is made', () => {
    expect(useConsentStore.getState().isConsentValid()).toBe(false);
  });

  it('persists the accepted policy version alongside the decision', () => {
    acceptUnderPolicy();
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string);
    expect(persisted.state.acceptedPolicyVersion).toBe(CONSENT_POLICY_VERSION);
  });
});