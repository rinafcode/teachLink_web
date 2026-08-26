import { beforeEach, describe, expect, it } from 'vitest';
import { useConsentStore } from '../store';
import { createDefaultConsentState } from '../types';
import {
  clearStorageClassRegistry,
  enforceStorageClasses,
  getClassifiedItem,
  getStorageClass,
  isStorageClassAllowed,
  listRegisteredStorageKeys,
  purgeDisallowedStorage,
  registerStorageKey,
  removeClassifiedItem,
  setClassifiedItem,
  unregisterStorageKey,
} from '../storageClasses';

function clearAllCookies() {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
  useConsentStore.setState(createDefaultConsentState());
  clearStorageClassRegistry();
});

describe('storage key registry', () => {
  it('registers and retrieves a descriptor', () => {
    registerStorageKey({ key: 'foo', category: 'analytics', area: 'localStorage' });
    expect(getStorageClass('foo')).toEqual({ key: 'foo', category: 'analytics', area: 'localStorage' });
  });

  it('returns undefined for an unregistered key', () => {
    expect(getStorageClass('missing')).toBeUndefined();
  });

  it('unregisterStorageKey removes a descriptor', () => {
    registerStorageKey({ key: 'foo', category: 'analytics', area: 'localStorage' });
    unregisterStorageKey('foo');
    expect(getStorageClass('foo')).toBeUndefined();
  });

  it('listRegisteredStorageKeys lists everything registered', () => {
    registerStorageKey({ key: 'a', category: 'analytics', area: 'localStorage' });
    registerStorageKey({ key: 'b', category: 'marketing', area: 'cookie' });
    expect(listRegisteredStorageKeys()).toHaveLength(2);
  });

  it('clearStorageClassRegistry forgets everything', () => {
    registerStorageKey({ key: 'foo', category: 'analytics', area: 'localStorage' });
    clearStorageClassRegistry();
    expect(listRegisteredStorageKeys()).toHaveLength(0);
  });
});

describe('isStorageClassAllowed', () => {
  it('always allows the necessary category', () => {
    expect(isStorageClassAllowed('necessary')).toBe(true);
  });

  it('disallows optional categories before a decision is made', () => {
    expect(isStorageClassAllowed('analytics')).toBe(false);
    expect(isStorageClassAllowed('functional')).toBe(false);
    expect(isStorageClassAllowed('marketing')).toBe(false);
  });

  it('allows a category once accepted', () => {
    useConsentStore.getState().acceptAll();
    expect(isStorageClassAllowed('analytics')).toBe(true);
    expect(isStorageClassAllowed('marketing')).toBe(true);
  });

  it('disallows a category after it is explicitly rejected', () => {
    useConsentStore.getState().acceptAll();
    useConsentStore.getState().rejectAll();
    expect(isStorageClassAllowed('analytics')).toBe(false);
  });
});

describe('setClassifiedItem / getClassifiedItem', () => {
  it('blocks localStorage writes for a non-consented category', () => {
    const ok = setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '123');
    expect(ok).toBe(false);
    expect(localStorage.getItem('ga_client_id')).toBeNull();
  });

  it('always allows writes for the necessary category', () => {
    const ok = setClassifiedItem({ key: 'session_id', category: 'necessary', area: 'localStorage' }, 'abc');
    expect(ok).toBe(true);
    expect(localStorage.getItem('session_id')).toBe('abc');
  });

  it('allows writes once the category is consented to', () => {
    useConsentStore.getState().savePreferences({ analytics: true });
    const ok = setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '123');
    expect(ok).toBe(true);
    expect(localStorage.getItem('ga_client_id')).toBe('123');
  });

  it('round-trips sessionStorage entries', () => {
    useConsentStore.getState().savePreferences({ functional: true });
    setClassifiedItem({ key: 'ui_layout', category: 'functional', area: 'sessionStorage' }, 'grid');
    expect(getClassifiedItem('ui_layout')).toBe('grid');
    expect(sessionStorage.getItem('ui_layout')).toBe('grid');
  });

  it('round-trips cookie entries', () => {
    useConsentStore.getState().savePreferences({ marketing: true });
    setClassifiedItem({ key: 'ad_id', category: 'marketing', area: 'cookie' }, 'xyz');
    expect(getClassifiedItem('ad_id')).toBe('xyz');
    expect(document.cookie).toContain('ad_id=xyz');
  });

  it('registers the descriptor even when the write is blocked', () => {
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '123');
    expect(getStorageClass('ga_client_id')).toEqual({
      key: 'ga_client_id',
      category: 'analytics',
      area: 'localStorage',
    });
  });

  it('returns null for an unregistered key', () => {
    expect(getClassifiedItem('unknown')).toBeNull();
  });

  it('returns null once consent is withdrawn, even if the raw value is still present', () => {
    useConsentStore.getState().savePreferences({ analytics: true });
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '123');

    useConsentStore.getState().savePreferences({ analytics: false });

    expect(getClassifiedItem('ga_client_id')).toBeNull();
    // the raw value is untouched until a purge runs
    expect(localStorage.getItem('ga_client_id')).toBe('123');
  });
});

describe('removeClassifiedItem', () => {
  it('removes a registered entry from its underlying storage', () => {
    setClassifiedItem({ key: 'session_id', category: 'necessary', area: 'localStorage' }, 'abc');
    removeClassifiedItem('session_id');
    expect(localStorage.getItem('session_id')).toBeNull();
  });

  it('is a no-op for an unregistered key', () => {
    expect(() => removeClassifiedItem('unknown')).not.toThrow();
  });
});

describe('purgeDisallowedStorage', () => {
  it('removes localStorage, sessionStorage, and cookie entries for revoked categories, keeping necessary/allowed ones', () => {
    useConsentStore.getState().acceptAll();
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '1');
    setClassifiedItem({ key: 'ui_layout', category: 'functional', area: 'sessionStorage' }, 'grid');
    setClassifiedItem({ key: 'ad_id', category: 'marketing', area: 'cookie' }, 'x');
    setClassifiedItem({ key: 'session_id', category: 'necessary', area: 'localStorage' }, 'abc');

    useConsentStore.getState().rejectAll();
    const purged = purgeDisallowedStorage();

    expect([...purged].sort()).toEqual(['ad_id', 'ga_client_id', 'ui_layout']);
    expect(localStorage.getItem('ga_client_id')).toBeNull();
    expect(sessionStorage.getItem('ui_layout')).toBeNull();
    expect(document.cookie).not.toContain('ad_id=');
    expect(localStorage.getItem('session_id')).toBe('abc');
  });

  it('is a no-op when nothing is registered', () => {
    expect(purgeDisallowedStorage()).toEqual([]);
  });

  it('is a no-op when every registered category is still allowed', () => {
    useConsentStore.getState().acceptAll();
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '1');
    expect(purgeDisallowedStorage()).toEqual([]);
    expect(localStorage.getItem('ga_client_id')).toBe('1');
  });
});

describe('enforceStorageClasses', () => {
  it('purges already-disallowed entries immediately on start', () => {
    useConsentStore.getState().acceptAll();
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '1');
    useConsentStore.getState().rejectAll();
    expect(localStorage.getItem('ga_client_id')).toBe('1'); // stale until enforcement starts

    const unsubscribe = enforceStorageClasses();

    expect(localStorage.getItem('ga_client_id')).toBeNull();
    unsubscribe();
  });

  it('re-purges automatically whenever consent changes', () => {
    const unsubscribe = enforceStorageClasses();

    useConsentStore.getState().savePreferences({ analytics: true });
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '2');
    expect(localStorage.getItem('ga_client_id')).toBe('2');

    useConsentStore.getState().rejectAll();
    expect(localStorage.getItem('ga_client_id')).toBeNull();

    unsubscribe();
  });

  it('stops purging after unsubscribe is called', () => {
    const unsubscribe = enforceStorageClasses();
    unsubscribe();

    useConsentStore.getState().savePreferences({ analytics: true });
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '1');
    useConsentStore.getState().rejectAll();

    // no active subscription, so the stale value survives until something else purges it
    expect(localStorage.getItem('ga_client_id')).toBe('1');
  });
});
