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
}

const MAX_HISTORY_SIZE = 50;

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
      }),
      {
        name: 'bulk-history-storage',
        storage: {
          getItem: (name) => {
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
          setItem: (name, value) => {
            localStorage.setItem(name, value);
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      },
    ),
  );

  return store;
}

export default useBulkHistory;
