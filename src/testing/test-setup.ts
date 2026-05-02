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
