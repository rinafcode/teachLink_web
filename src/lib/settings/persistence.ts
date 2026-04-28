/**
 * SSR-safe browser localStorage wrapper for JSON values.
 */

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const localStorageJson = {
  get<T>(key: string): T | null {
    const s = getStorage();
    if (!s) return null;
    try {
      const raw = s.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    const s = getStorage();
    if (!s) return false;
    try {
      s.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    const s = getStorage();
    try {
      s?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
