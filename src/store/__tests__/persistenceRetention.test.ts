import { describe, it, expect, beforeEach } from 'vitest';
import {
  IDBFactory,
  IDBKeyRange,
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory as _IDBFactory,
  IDBIndex,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
} from 'fake-indexeddb';

// The shared test setup stubs IndexedDB; swap in the real fake implementation
// so the persistence layer actually stores something.
(globalThis as any).indexedDB = new IDBFactory();
(globalThis as any).IDBKeyRange = IDBKeyRange;
(globalThis as any).IDBCursor = IDBCursor;
(globalThis as any).IDBCursorWithValue = IDBCursorWithValue;
(globalThis as any).IDBDatabase = IDBDatabase;
(globalThis as any).IDBFactory = _IDBFactory;
(globalThis as any).IDBIndex = IDBIndex;
(globalThis as any).IDBObjectStore = IDBObjectStore;
(globalThis as any).IDBOpenDBRequest = IDBOpenDBRequest;
(globalThis as any).IDBRequest = IDBRequest;
(globalThis as any).IDBTransaction = IDBTransaction;

import {
  PERSISTENCE_META_PREFIX,
  getPersistedEntryUpdatedAt,
  isMetaKey,
  persistenceLayer,
  purgeExpiredPersistedEntries,
  selectExpiredKeys,
  touchPersistedEntry,
} from '../persistenceLayer';

const DAY = 24 * 60 * 60 * 1000;

describe('isMetaKey', () => {
  it('recognises a metadata key', () => {
    expect(isMetaKey(`${PERSISTENCE_META_PREFIX}teachlink-storage`)).toBe(true);
  });

  it('rejects a data key and a non-string', () => {
    expect(isMetaKey('teachlink-storage')).toBe(false);
    expect(isMetaKey(42)).toBe(false);
  });
});

describe('selectExpiredKeys', () => {
  const now = Date.UTC(2026, 0, 31);

  it('selects entries older than the window', () => {
    const expired = selectExpiredKeys(
      [
        { key: 'stale', updatedAt: now - 31 * DAY },
        { key: 'fresh', updatedAt: now - 1 * DAY },
      ],
      30 * DAY,
      now,
    );

    expect(expired).toEqual(['stale']);
  });

  it('keeps an entry exactly on the boundary', () => {
    expect(
      selectExpiredKeys([{ key: 'edge', updatedAt: now - 30 * DAY }], 30 * DAY, now),
    ).toEqual([]);
  });

  // An entry written before this metadata existed has no timestamp; deleting
  // it would silently drop a user's state on upgrade.
  it('keeps entries with no recorded timestamp', () => {
    expect(selectExpiredKeys([{ key: 'legacy' }], 30 * DAY, now)).toEqual([]);
  });

  it('returns nothing for an empty list', () => {
    expect(selectExpiredKeys([], 30 * DAY, now)).toEqual([]);
  });

  it('selects every expired entry', () => {
    const expired = selectExpiredKeys(
      [
        { key: 'a', updatedAt: now - 90 * DAY },
        { key: 'b', updatedAt: now - 60 * DAY },
        { key: 'c', updatedAt: now },
      ],
      30 * DAY,
      now,
    );

    expect(expired).toEqual(['a', 'b']);
  });
});

describe('persisted entry metadata', () => {
  beforeEach(async () => {
    await persistenceLayer.removeItem('slice-a');
    await persistenceLayer.removeItem('slice-b');
  });

  it('stamps a write timestamp', async () => {
    await persistenceLayer.setItem('slice-a', JSON.stringify({ value: 1 }));

    const updatedAt = await getPersistedEntryUpdatedAt('slice-a');

    expect(typeof updatedAt).toBe('number');
  });

  it('reports null for an entry that was never written', async () => {
    expect(await getPersistedEntryUpdatedAt('never-written')).toBeNull();
  });

  it('advances the timestamp on rewrite', async () => {
    await touchPersistedEntry('slice-a', 1_000);
    await touchPersistedEntry('slice-a', 2_000);

    expect(await getPersistedEntryUpdatedAt('slice-a')).toBe(2_000);
  });

  it('still round-trips the stored value', async () => {
    await persistenceLayer.setItem('slice-a', JSON.stringify({ value: 7 }));

    expect(await persistenceLayer.getItem('slice-a')).toBe(JSON.stringify({ value: 7 }));
  });

  // Metadata for a deleted entry would otherwise linger forever.
  it('drops metadata when the entry is removed', async () => {
    await persistenceLayer.setItem('slice-a', JSON.stringify({ value: 1 }));
    await persistenceLayer.removeItem('slice-a');

    expect(await getPersistedEntryUpdatedAt('slice-a')).toBeNull();
  });
});

describe('purgeExpiredPersistedEntries', () => {
  beforeEach(async () => {
    await persistenceLayer.removeItem('slice-a');
    await persistenceLayer.removeItem('slice-b');
    await persistenceLayer.removeItem('legacy');
  });

  it('deletes an entry past its retention window', async () => {
    await persistenceLayer.setItem('slice-a', JSON.stringify({ value: 1 }));
    await touchPersistedEntry('slice-a', 0);

    const removed = await purgeExpiredPersistedEntries(30 * DAY, 31 * DAY);

    expect(removed).toContain('slice-a');
    expect(await persistenceLayer.getItem('slice-a')).toBeNull();
  });

  it('keeps a recently written entry', async () => {
    await persistenceLayer.setItem('slice-b', JSON.stringify({ value: 2 }));

    const removed = await purgeExpiredPersistedEntries(30 * DAY);

    expect(removed).not.toContain('slice-b');
    expect(await persistenceLayer.getItem('slice-b')).toBe(JSON.stringify({ value: 2 }));
  });

  it('removes the metadata alongside the entry', async () => {
    await persistenceLayer.setItem('slice-a', JSON.stringify({ value: 1 }));
    await touchPersistedEntry('slice-a', 0);
    await purgeExpiredPersistedEntries(30 * DAY, 31 * DAY);

    expect(await getPersistedEntryUpdatedAt('slice-a')).toBeNull();
  });

  it('leaves an entry with no metadata alone', async () => {
    await persistenceLayer.setItem('legacy', JSON.stringify({ value: 3 }));
    // Simulate a value written before metadata existed.
    await persistenceLayer.removeItem(`${PERSISTENCE_META_PREFIX}legacy`);

    await purgeExpiredPersistedEntries(0, Number.MAX_SAFE_INTEGER);

    expect(await persistenceLayer.getItem('legacy')).toBe(JSON.stringify({ value: 3 }));
  });

  it('reports nothing removed when the store is empty of expired entries', async () => {
    expect(await purgeExpiredPersistedEntries(30 * DAY)).toEqual([]);
  });
});
