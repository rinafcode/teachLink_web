import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for tests
const createMockDB = () => ({
  get: vi.fn(),
  put: vi.fn(),
  add: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      get: vi.fn(),
      put: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
    })),
    done: Promise.resolve(),
  })),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

const createMockRequest = () => {
  const db = createMockDB();
  const request = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    result: db,
    error: null,
    readyState: 'done',
    then: vi.fn((cb) => Promise.resolve(db).then(cb)),
    catch: vi.fn((cb) => Promise.resolve(db).catch(cb)),
    finally: vi.fn((cb) => Promise.resolve(db).finally(cb)),
  };
  return request;
};

const indexedDB = {
  open: vi.fn(() => createMockRequest()),
  deleteDatabase: vi.fn(() => createMockRequest()),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Polyfill missing IndexedDB classes for the 'idb' library
class MockIDBRequest {}
class MockIDBDatabase {}
class MockIDBTransaction {}
class MockIDBCursor {}
class MockIDBObjectStore {}
class MockIDBIndex {}

Object.assign(global, {
  IDBRequest: MockIDBRequest,
  IDBDatabase: MockIDBDatabase,
  IDBTransaction: MockIDBTransaction,
  IDBCursor: MockIDBCursor,
  IDBObjectStore: MockIDBObjectStore,
  IDBIndex: MockIDBIndex,
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

const cssStyleDeclarationProto = window.CSSStyleDeclaration.prototype as CSSStyleDeclaration & {
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
};

const cssStyleValues = new WeakMap<object, Record<string, string>>();
const nativeSetProperty = cssStyleDeclarationProto.setProperty;
const nativeGetPropertyValue = cssStyleDeclarationProto.getPropertyValue;

Object.defineProperty(cssStyleDeclarationProto, 'setProperty', {
  configurable: true,
  value: function (name: string, value: string) {
    const safeAreaNames = ['padding-bottom', 'padding-left', 'padding-right'];
    if (safeAreaNames.includes(name)) {
      const existing = cssStyleValues.get(this as object) || {};
      existing[name] = value;
      cssStyleValues.set(this as object, existing);
      return;
    }
    return nativeSetProperty.call(this, name, value);
  },
});

Object.defineProperty(cssStyleDeclarationProto, 'getPropertyValue', {
  configurable: true,
  value: function (name: string) {
    const stored = cssStyleValues.get(this as object)?.[name];
    if (stored !== undefined) {
      return stored;
    }
    return nativeGetPropertyValue.call(this, name);
  },
});

Object.defineProperty(cssStyleDeclarationProto, 'paddingBottom', {
  configurable: true,
  enumerable: true,
  get() {
    return this.getPropertyValue('padding-bottom');
  },
  set(value: string) {
    this.setProperty('padding-bottom', value);
  },
});

Object.defineProperty(cssStyleDeclarationProto, 'paddingLeft', {
  configurable: true,
  enumerable: true,
  get() {
    return this.getPropertyValue('padding-left');
  },
  set(value: string) {
    this.setProperty('padding-left', value);
  },
});

Object.defineProperty(cssStyleDeclarationProto, 'paddingRight', {
  configurable: true,
  enumerable: true,
  get() {
    return this.getPropertyValue('padding-right');
  },
  set(value: string) {
    this.setProperty('padding-right', value);
  },
});
