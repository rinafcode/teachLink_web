// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BulkHistoryOperation = 'create' | 'update' | 'delete';

/**
 * Snapshot of data before a bulk operation for undo capability.
 */
export interface BulkHistoryEntry<T> {
  id: string;
  operation: BulkHistoryOperation;
  timestamp: number;
  snapshot: T[];
  itemCount: number;
  description?: string;
}

export interface UseBulkHistoryResult<T> {
  /** History entries (past operations) */
  history: BulkHistoryEntry<T>[];
  /** Redo stack (future operations) */
  redoStack: BulkHistoryEntry<T>[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Push a new operation onto history */
  push: (entry: Omit<BulkHistoryEntry<T>, 'id' | 'timestamp'>) => void;
  /** Undo to previous state, returning the snapshot that was undone */
  undo: () => BulkHistoryEntry<T> | null;
  /** Redo to next state */
  redo: () => BulkHistoryEntry<T> | null;
  /** Clear all history */
  clear: () => void;
  /** Get current history index */
  getCurrentIndex: () => number;
  /** Paginated view of the history (most recent first). */
  getHistoryPage: (page?: number, pageSize?: number) => BulkHistoryPage<T>;
}

/** A single page of history entries with paging metadata. */
export interface BulkHistoryPage<T> {
  /** Entries for the requested page (most recent first). */
  entries: BulkHistoryEntry<T>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export const MAX_HISTORY_SIZE = 50;

/** Maximum number of history entries persisted to storage. */
export const MAX_PERSISTED_HISTORY_SIZE = 100;

/** Default page size returned by `getHistoryPage`. */
export const DEFAULT_HISTORY_PAGE_SIZE = 20;

/**
 * Returns a page of history entries, most recent first (history is stored
 * oldest-first so a full reverse is applied per page). Invalid pages are
 * clamped to the nearest valid page.
 */
export function paginateBulkHistory<T>(
  entries: BulkHistoryEntry<T>[],
  page: number,
  pageSize: number,
): BulkHistoryPage<T> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safePageSize = Math.max(1, Math.floor(pageSize) || DEFAULT_HISTORY_PAGE_SIZE);
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * safePageSize;
  const mostRecentFirst = entries.slice().reverse();
  const sliced = mostRecentFirst.slice(start, start + safePageSize);

  return {
    entries: sliced,
    page: clampedPage,
    pageSize: safePageSize,
    total,
    totalPages,
    hasMore: clampedPage < totalPages,
    hasPrevious: clampedPage > 1,
  };
}

/**
 * localStorage adapter for bulk history. Enforces an upper bound on the number
 * of persisted entries so the stored payload cannot grow without limit.
 */
export const bulkHistoryPersistence = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      // Don't persist redo stack
      parsed.state = {
        ...parsed.state,
        redoStack: [],
      };
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed.state?.history)) {
        if (parsed.state.history.length > MAX_PERSISTED_HISTORY_SIZE) {
          parsed.state.history = parsed.state.history.slice(
            -MAX_PERSISTED_HISTORY_SIZE,
          );
        }
        value = JSON.stringify(parsed);
      }
    } catch {
      // Leave the original value untouched when it is not JSON.
    }
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

/**
 * Hook for managing undo/redo stack for bulk operations.
 *
 * @template T Type of items being tracked
 */
export function useBulkHistory<T>(): UseBulkHistoryResult<T> {
  const store = create<UseBulkHistoryResult<T>>()(
    persist(
      (set, get) => ({
        history: [],
        redoStack: [],
        canUndo: false,
        canRedo: false,

        push: (entry) =>
          set((state) => {
            const newEntry: BulkHistoryEntry<T> = {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            };

            const newHistory = state.history.slice(0, state.history.length);
            newHistory.push(newEntry);

            // Limit history size
            if (newHistory.length > MAX_HISTORY_SIZE) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              redoStack: [], // Clear redo stack on new action
              canUndo: newHistory.length > 0,
              canRedo: false,
            };
          }),

        undo: () =>
          set((state) => {
            if (state.history.length <= 1) {
              return state;
            }

            const currentIndex = state.history.length - 1;
            const undoneEntry = state.history[currentIndex];
            const newHistory = state.history.slice(0, currentIndex);
            const newRedoStack = [undoneEntry, ...state.redoStack];

            return {
              history: newHistory,
              redoStack: newRedoStack,
              canUndo: newHistory.length > 0,
              canRedo: true,
            };
          }),

        redo: () =>
          set((state) => {
            if (state.redoStack.length === 0) {
              return state;
            }

            const [nextEntry, ...remainingRedo] = state.redoStack;
            const newHistory = [...state.history, nextEntry];

            // Keep the redo path bounded as well so the history can never grow
            // beyond the in-memory cap.
            if (newHistory.length > MAX_HISTORY_SIZE) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              redoStack: remainingRedo,
              canUndo: true,
              canRedo: remainingRedo.length > 0,
            };
          }),

        clear: () =>
          set({
            history: [],
            redoStack: [],
            canUndo: false,
            canRedo: false,
          }),

        getCurrentIndex: () => get().history.length - 1,

        getHistoryPage: (page?: number, pageSize?: number) =>
          paginateBulkHistory(
            get().history,
            page ?? 1,
            pageSize ?? DEFAULT_HISTORY_PAGE_SIZE,
          ),
      }),
      {
        name: 'bulk-history-storage',
        storage: bulkHistoryPersistence,
      },
    ),
  );

  return store;
}

export default useBulkHistory;
