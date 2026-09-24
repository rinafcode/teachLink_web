'use client';

/**
 * @module consent/storageClasses
 *
 * Storage Classes for GDPR compliance.
 *
 * Every piece of client-side storage (localStorage, sessionStorage, cookies) that
 * isn't strictly necessary for the app to function must be tied to a consent
 * category (see `CookieCategory` in `./types`). This module lets call sites
 * declare which category a given storage key belongs to, gates reads/writes
 * against the user's current consent, and purges storage that becomes
 * disallowed when consent is withdrawn (GDPR Art. 7(3): withdrawing consent
 * must be as effective as giving it).
 */
import { useEffect } from 'react';
import { useConsentStore } from './store';
import type { CookieCategory } from './types';

export type StorageArea = 'localStorage' | 'sessionStorage' | 'cookie';

export interface StorageClassDescriptor {
  /** Storage key (or cookie name) this descriptor governs. */
  key: string;
  /** GDPR consent category this storage entry belongs to. */
  category: CookieCategory;
  /** Underlying browser storage mechanism. */
  area: StorageArea;
}

const registry = new Map<string, StorageClassDescriptor>();

/** Declares a storage key's GDPR category so it can be gated and purged. */
export function registerStorageKey(descriptor: StorageClassDescriptor): void {
  registry.set(descriptor.key, descriptor);
}

export function unregisterStorageKey(key: string): void {
  registry.delete(key);
}

export function getStorageClass(key: string): StorageClassDescriptor | undefined {
  return registry.get(key);
}

export function listRegisteredStorageKeys(): StorageClassDescriptor[] {
  return Array.from(registry.values());
}

/** Forgets every registered descriptor. Mainly useful for tests and logout flows. */
export function clearStorageClassRegistry(): void {
  registry.clear();
}

/** Whether the given category is currently consented to (necessary is always allowed). */
export function isStorageClassAllowed(category: CookieCategory): boolean {
  if (category === 'necessary') return true;
  return useConsentStore.getState().preferences[category];
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  for (const entry of document.cookie.split('; ')) {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) continue;
    if (entry.slice(0, separatorIndex) === name) {
      return decodeURIComponent(entry.slice(separatorIndex + 1));
    }
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function getBrowserStorage(area: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return area === 'localStorage' ? window.localStorage : window.sessionStorage;
  } catch {
    // Storage unavailable (e.g. private browsing with strict settings)
    return null;
  }
}

function removeFromStorage(descriptor: StorageClassDescriptor): void {
  if (descriptor.area === 'cookie') {
    deleteCookie(descriptor.key);
    return;
  }
  try {
    getBrowserStorage(descriptor.area)?.removeItem(descriptor.key);
  } catch {
    // ignore
  }
}

/**
 * Registers the descriptor and writes `value` to its storage area, but only
 * if the descriptor's category is currently consented to. Returns whether
 * the write actually happened.
 */
export function setClassifiedItem(descriptor: StorageClassDescriptor, value: string): boolean {
  registerStorageKey(descriptor);
  if (!isStorageClassAllowed(descriptor.category)) return false;

  if (descriptor.area === 'cookie') {
    writeCookie(descriptor.key, value);
    return true;
  }
  const storage = getBrowserStorage(descriptor.area);
  if (!storage) return false;
  try {
    storage.setItem(descriptor.key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a previously registered key. Returns null for unregistered keys and
 * for keys whose category is not currently consented to, even if a stale
 * value is still physically present in storage.
 */
export function getClassifiedItem(key: string): string | null {
  const descriptor = registry.get(key);
  if (!descriptor || !isStorageClassAllowed(descriptor.category)) return null;

  if (descriptor.area === 'cookie') return readCookie(key);
  try {
    return getBrowserStorage(descriptor.area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Removes a registered key's value from its underlying storage area. */
export function removeClassifiedItem(key: string): void {
  const descriptor = registry.get(key);
  if (!descriptor) return;
  removeFromStorage(descriptor);
}

/**
 * Removes every registered storage entry whose category is no longer
 * consented to. Returns the keys that were purged.
 */
export function purgeDisallowedStorage(): string[] {
  const purged: string[] = [];
  for (const descriptor of registry.values()) {
    if (!isStorageClassAllowed(descriptor.category)) {
      removeFromStorage(descriptor);
      purged.push(descriptor.key);
    }
  }
  return purged;
}

/**
 * Starts enforcing storage classes: purges any already-disallowed entries
 * immediately, then re-purges on every consent change. Returns an
 * unsubscribe function.
 */
export function enforceStorageClasses(): () => void {
  purgeDisallowedStorage();
  return useConsentStore.subscribe(() => {
    purgeDisallowedStorage();
  });
}

/** React hook that runs {@link enforceStorageClasses} for the lifetime of the component. */
export function useStorageClassEnforcement(): void {
  useEffect(() => enforceStorageClasses(), []);
}
