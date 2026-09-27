import { beforeEach, describe, expect, it } from 'vitest';
import {
  useBulkHistory,
  bulkHistoryPersistence,
  DEFAULT_HISTORY_PAGE_SIZE,
  MAX_HISTORY_SIZE,
  MAX_PERSISTED_HISTORY_SIZE,
  paginateBulkHistory,
  type BulkHistoryEntry,
  type UseBulkHistoryResult,
} from '../bulkHistory';

function storeFor(history: ReturnType<typeof useBulkHistory<string>>) {
  return history as unknown as { getState: () => UseBulkHistoryResult<string> };
}

function makeEntry(id: string): Partial<BulkHistoryEntry<string>> {
  return {
    operation: 'create',
    snapshot: [id],
    itemCount: 1,
    description: id,
  };
}

function pushMany(history: ReturnType<typeof useBulkHistory<string>>, count: number) {
  const store = storeFor(history);
  for (let i = 0; i < count; i += 1) {
    store.getState().push(makeEntry(`item-${i}`) as any);
  }
}

beforeEach(() => {
  localStorage.clear();
});

describe('paginateBulkHistory', () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({
    ...makeEntry(`e-${index}`),
    id: String(index),
    timestamp: index,
  })) as BulkHistoryEntry<string>[];

  it('returns the most recent entries first on page 1', () => {
    const page = paginateBulkHistory(entries, 1, 10);
    expect(page.entries.map((e) => e.id)).toEqual([
      '24',
      '23',
      '22',
      '21',
      '20',
      '19',
      '18',
      '17',
      '16',
      '15',
    ]);
    expect(page.total).toBe(25);
    expect(page.totalPages).toBe(3);
    expect(page.hasMore).toBe(true);
    expect(page.hasPrevious).toBe(false);
  });

  it('returns the correct middle page', () => {
    const page = paginateBulkHistory(entries, 2, 10);
    expect(page.entries.map((e) => e.id)).toEqual([
      '14',
      '13',
      '12',
      '11',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
    ]);
    expect(page.hasMore).toBe(true);
    expect(page.hasPrevious).toBe(true);
  });

  it('clamps out-of-range pages', () => {
    const page = paginateBulkHistory(entries, 99, 10);
    expect(page.page).toBe(3);
    expect(page.entries.map((e) => e.id)).toEqual(['4', '3', '2', '1', '0']);
    expect(page.hasMore).toBe(false);
  });

  it('handles an empty history', () => {
    const page = paginateBulkHistory([], 1, 10);
    expect(page.entries).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.totalPages).toBe(1);
    expect(page.hasMore).toBe(false);
  });
});

describe('useBulkHistory paging', () => {
  it('exposes paginated history (most recent first)', () => {
    const store = storeFor(useBulkHistory<string>());
    pushMany(store, 12);
    const page = store.getState().getHistoryPage(1, DEFAULT_HISTORY_PAGE_SIZE);
    expect(page.entries.length).toBe(12);
    expect(page.entries[0].description).toBe('item-11');
    expect(page.total).toBe(12);
  });
});

describe('useBulkHistory size caps', () => {
  it('keeps the in-memory history within MAX_HISTORY_SIZE after push', () => {
    const store = storeFor(useBulkHistory<string>());
    pushMany(store, MAX_HISTORY_SIZE + 20);
    expect(store.getState().history.length).toBe(MAX_HISTORY_SIZE);
  });

  it('keeps history within MAX_HISTORY_SIZE across redo cycles', () => {
    const store = storeFor(useBulkHistory<string>());
    pushMany(store, MAX_HISTORY_SIZE);
    for (let i = 0; i < MAX_HISTORY_SIZE - 5; i += 1) {
      store.getState().undo();
    }
    for (let i = 0; i < MAX_HISTORY_SIZE - 5; i += 1) {
      store.getState().redo();
    }
    expect(store.getState().history.length).toBeLessThanOrEqual(
      MAX_HISTORY_SIZE,
    );
  });
});

describe('bulkHistoryPersistence', () => {
  it('caps the persisted history at MAX_PERSISTED_HISTORY_SIZE', () => {
    const history = Array.from({ length: MAX_PERSISTED_HISTORY_SIZE + 50 }, (_, i) => ({
      id: String(i),
      operation: 'create',
      timestamp: i,
      snapshot: [i],
      itemCount: 1,
    }));
    bulkHistoryPersistence.setItem(
      'bulk-history-storage',
      JSON.stringify({ state: { history, redoStack: [] } }),
    );
    const stored = JSON.parse(
      localStorage.getItem('bulk-history-storage') as string,
    );
    expect(stored.state.history.length).toBe(MAX_PERSISTED_HISTORY_SIZE);
    expect(stored.state.history[0].id).toBe(
      String(MAX_PERSISTED_HISTORY_SIZE + 50 - MAX_PERSISTED_HISTORY_SIZE),
    );
  });

  it('drops the persisted redo stack on read', () => {
    bulkHistoryPersistence.setItem(
      'bulk-history-storage',
      JSON.stringify({
        state: { history: [makeEntry('a')], redoStack: [makeEntry('b')] },
      }),
    );
    const raw = bulkHistoryPersistence.getItem('bulk-history-storage');
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.redoStack).toEqual([]);
    expect(parsed.state.history).toHaveLength(1);
  });
});