import { openDB } from 'idb';
import { createLogger } from '@/lib/logging';

const logger = createLogger('persistence-layer');

const DB_NAME = 'teachlink_state_v1';
const STORE_NAME = 'app_state';

/**
 * Persistence layer using IndexedDB for large state objects.
 */
export const persistenceLayer = {
  /**
   * Loads the state from IndexedDB.
   */
  async getItem(name: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
      const data = await db.get(STORE_NAME, name);
      return data ? JSON.stringify(data) : null;
    } catch (error) {
      logger.error('[Persistence] Error loading state', { error });
      return null;
    }
  },

  /**
   * Saves the state to IndexedDB.
   */
  async setItem(name: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
      await db.put(STORE_NAME, JSON.parse(value), name);
    } catch (error) {
      logger.error('[Persistence] Error saving state', { error });
    }
  },

  /**
   * Removes the state from IndexedDB.
   */
  async removeItem(name: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, name);
  },

  /**
   * Loads a JSON value stored under `name` (returns null when absent).
   */
  async getJSON<T>(name: string): Promise<T | null> {
    const raw = await this.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Persists a JSON value under `name`.
   */
  async setJSON<T>(name: string, value: T): Promise<void> {
    await this.setItem(name, JSON.stringify(value));
  },
};

/** A single page of a persisted JSON array with paging metadata. */
export interface PersistedPage<T> {
  entries: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Returns a page of a JSON array previously stored under `name`. Indices are
 * treated as ordered most-recent-first by the caller; this helper only slices.
 * Returns `null` when no value (or a non-array value) is stored.
 */
export async function paginatePersistedJSON<T>(
  name: string,
  page: number,
  pageSize: number,
): Promise<PersistedPage<T> | null> {
  const raw = await persistenceLayer.getJSON<unknown>(name);
  if (!Array.isArray(raw)) return null;
  const entries = raw as T[];
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safePageSize = Math.max(1, Math.floor(pageSize) || 20);
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * safePageSize;
  return {
    entries: entries.slice(start, start + safePageSize),
    page: clampedPage,
    pageSize: safePageSize,
    total,
    totalPages,
    hasMore: clampedPage < totalPages,
  };
}

/**
 * Returns a copy of `value` keeping only the given top-level keys. Used to
 * prune unknown/stale slices from a persisted state when the schema version
 * has changed.
 */
export function pruneUnknownKeys<T extends Record<string, unknown>>(
  value: T,
  allowedKeys: readonly string[],
): Record<string, unknown> {
  const allowed = new Set(allowedKeys);
  const pruned: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) pruned[key] = value[key];
  }
  return pruned;
}

/**
 * Reads the schema `version` recorded inside a persisted zustand payload
 * (shape `{ state, version }`). Returns `undefined` when the payload is not
 * versioned JSON.
 */
export function persistedStateVersion(raw: string | null): number | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === 'number' ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}
