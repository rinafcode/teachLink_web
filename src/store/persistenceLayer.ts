import { openDB } from 'idb';
import { createLogger } from '@/lib/logging';
import { PERSISTED_STATE_RETENTION_MS } from '@/constants/app.constants';

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
      // Stamped on every write so retention has an age to work from.
      if (!isMetaKey(name)) await touchPersistedEntry(name);
    } catch (error) {
      logger.error('[Persistence] Error saving state', { error });
    }
  },

  /**
   * Removes the state from IndexedDB.
   */
  async removeItem(name: string): Promise<void> {
    if (typeof window === 'undefined') return;
    // The upgrade callback matters here as much as in the read and write
    // paths: without it, opening a database that does not exist yet creates
    // one with no object store, and the delete throws NotFoundError.
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
    await db.delete(STORE_NAME, name);
    // Metadata for a deleted entry would otherwise linger forever.
    await db.delete(STORE_NAME, `${PERSISTENCE_META_PREFIX}${name}`);
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

// ---------------------------------------------------------------------------
// Retention / GC for persisted slices
// ---------------------------------------------------------------------------

/**
 * Key prefix under which write timestamps are recorded.
 *
 * Metadata lives in the same object store as the data rather than in a new
 * one, because adding a store means bumping `DB_NAME`'s version and running an
 * upgrade against every existing browser — a lot of risk for a timestamp.
 */
export const PERSISTENCE_META_PREFIX = '__meta__:';

/** Write metadata recorded alongside each persisted entry. */
export interface PersistedEntryMeta {
  updatedAt: number;
}

const metaKey = (name: string) => `${PERSISTENCE_META_PREFIX}${name}`;

/** True for the metadata companion of a persisted entry, not an entry itself. */
export function isMetaKey(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith(PERSISTENCE_META_PREFIX);
}

/**
 * Picks the entries whose last write is older than `maxAgeMs`.
 *
 * Pure, so retention can be tested without a database. An entry with no
 * recorded timestamp is **kept**: it predates this metadata and deleting it
 * would silently drop a user's state on upgrade.
 */
export function selectExpiredKeys(
  entries: ReadonlyArray<{ key: string; updatedAt?: number }>,
  maxAgeMs: number,
  now: number = Date.now(),
): string[] {
  return entries
    .filter((entry) => typeof entry.updatedAt === 'number' && now - entry.updatedAt > maxAgeMs)
    .map((entry) => entry.key);
}

/** Records the write timestamp for `name`. */
export async function touchPersistedEntry(
  name: string,
  now: number = Date.now(),
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
    await db.put(STORE_NAME, { updatedAt: now } satisfies PersistedEntryMeta, metaKey(name));
  } catch (error) {
    logger.error('[Persistence] Error recording entry metadata', { error });
  }
}

/** The last write timestamp for `name`, or null when none was recorded. */
export async function getPersistedEntryUpdatedAt(name: string): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
    const meta = (await db.get(STORE_NAME, metaKey(name))) as PersistedEntryMeta | undefined;
    return typeof meta?.updatedAt === 'number' ? meta.updatedAt : null;
  } catch (error) {
    logger.error('[Persistence] Error reading entry metadata', { error });
    return null;
  }
}

/**
 * Deletes persisted entries not written within `maxAgeMs`, and their metadata.
 *
 * Returns the keys removed. Entries written before metadata existed have no
 * timestamp and are left alone — see [`selectExpiredKeys`].
 */
export async function purgeExpiredPersistedEntries(
  maxAgeMs: number = PERSISTED_STATE_RETENTION_MS,
  now: number = Date.now(),
): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });

    const keys = (await db.getAllKeys(STORE_NAME)).filter(
      (key): key is string => typeof key === 'string',
    );
    const dataKeys = keys.filter((key) => !isMetaKey(key));

    const entries = await Promise.all(
      dataKeys.map(async (key) => {
        const meta = (await db.get(STORE_NAME, metaKey(key))) as PersistedEntryMeta | undefined;
        return { key, updatedAt: meta?.updatedAt };
      }),
    );

    const expired = selectExpiredKeys(entries, maxAgeMs, now);
    for (const key of expired) {
      await db.delete(STORE_NAME, key);
      await db.delete(STORE_NAME, metaKey(key));
    }

    // Metadata whose entry is gone is dead weight; drop it in the same pass.
    const orphanedMeta = keys.filter(
      (key) => isMetaKey(key) && !dataKeys.includes(key.slice(PERSISTENCE_META_PREFIX.length)),
    );
    for (const key of orphanedMeta) {
      await db.delete(STORE_NAME, key);
    }

    return expired;
  } catch (error) {
    logger.error('[Persistence] Error purging expired state', { error });
    return [];
  }
}
