import { describe, expect, it } from 'vitest';
import {
  persistedStateVersion,
  pruneUnknownKeys,
} from '../persistenceLayer';
import { migratePersistedStoreState } from '../stateManager';

describe('pruneUnknownKeys', () => {
  it('keeps only the allowed keys', () => {
    const value = {
      user: { id: 'u1' },
      app: { offlineMode: true },
      rogueSlice: { anything: 1 },
      anotherStaleSlice: [1, 2, 3],
    };
    const pruned = pruneUnknownKeys(value, ['user', 'app']);
    expect(Object.keys(pruned)).toEqual(['user', 'app']);
    expect(pruned.app).toEqual({ offlineMode: true });
  });

  it('returns an empty object when nothing is allowed', () => {
    expect(pruneUnknownKeys({ a: 1, b: 2 }, [])).toEqual({});
  });
});

describe('persistedStateVersion', () => {
  it('extracts the version from a versioned payload', () => {
    const raw = JSON.stringify({ state: { user: {} }, version: 2 });
    expect(persistedStateVersion(raw)).toBe(2);
  });

  it('returns undefined for an unversioned payload', () => {
    expect(persistedStateVersion(JSON.stringify({ state: {}, version: null }))).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    expect(persistedStateVersion('not-json')).toBeUndefined();
  });

  it('returns undefined for an empty value', () => {
    expect(persistedStateVersion(null)).toBeUndefined();
  });
});

describe('migratePersistedStoreState', () => {
  it('returns the payload untouched when versions match', () => {
    const state = { user: { id: 'u1' }, app: { offlineMode: true } };
    expect(migratePersistedStoreState(state, 1)).toEqual(state);
  });

  it('drops unknown slices on a version mismatch', () => {
    const stale = {
      user: { id: 'u1' },
      app: { offlineMode: true },
      discontinuedSlice: { data: 123 },
    };
    const migrated = migratePersistedStoreState(stale, 0) as Record<string, unknown>;
    expect(Object.keys(migrated)).toEqual(['user', 'app']);
    expect(migrated.user).toEqual({ id: 'u1' });
  });

  it('returns null when nothing was persisted', () => {
    expect(migratePersistedStoreState(null, 0)).toBeNull();
  });
});