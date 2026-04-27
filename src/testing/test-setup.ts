import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for tests
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn(() =>
      Promise.resolve({
        quota: 1024 * 1024 * 1024, // 1GB
        usage: 100 * 1024 * 1024, // 100MB
      }),
    ),
  },
  writable: true,
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() =>
      Promise.resolve({
        addEventListener: vi.fn(),
        unregister: vi.fn(),
        update: vi.fn(),
      }),
    ),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    controller: null,
  },
  writable: true,
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};
// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Polyfill localStorage if missing or incomplete (some JSDOM setups expose a
// stub without all Storage methods)
if (
  typeof window.localStorage === 'undefined' ||
  typeof window.localStorage.clear !== 'function'
) {
  const createStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
      get length() {
        return Object.keys(store).length;
      },
      clear: () => {
        store = {};
      },
      getItem: (key: string) => (key in store ? store[key] : null),
      key: (index: number) => Object.keys(store)[index] ?? null,
      removeItem: (key: string) => {
        delete store[key];
      },
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
    };
  };

  Object.defineProperty(window, 'localStorage', {
    value: createStorage(),
    writable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorage(),
    writable: true,
  });
}
