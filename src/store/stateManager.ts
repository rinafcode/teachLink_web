import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistenceLayer, pruneUnknownKeys } from './persistenceLayer';
import { deepMerge } from '../utils/stateUtils';
import { stateLogger } from './devTools';
import { UserRole } from '../types/api';

/**
 * Version of the persisted store schema. Bump when slices are added/removed or
 * their shapes change so stale persisted state is pruned (unknown slices are
 * dropped) instead of hydrating invalid state.
 */
export const PERSISTED_SCHEMA_VERSION = 1 as const;

/** Top-level slices the current store knows about and may hydrate. */
const PERSISTED_ALLOWED_KEYS = ['user', 'app'] as const;

/**
 * Zustand persist migration: prunes unknown/stale slices when a previously
 * persisted payload was written under an older schema version.
 */
export function migratePersistedStoreState(
  persistedState: unknown,
  version: number,
): unknown {
  if (version === PERSISTED_SCHEMA_VERSION || persistedState == null) {
    return persistedState;
  }
  return {
    ...pruneUnknownKeys(
      persistedState as Record<string, unknown>,
      PERSISTED_ALLOWED_KEYS,
    ),
  };
}

interface UserState {
  id: string | null;
  name: string | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    prefetching: boolean;
  };
}

/** UI-facing offline sync status reconciled after each drain. */
export type SyncStatusState = 'idle' | 'syncing' | 'pending' | 'conflicted' | 'resolved';

/** Default TTL for predicted-session entries before they are evicted. */
export const PREDICTED_SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Removes predicted-session entries whose last prediction timestamp is older
 * than the TTL. Returns the pruned map and the ids that were evicted.
 */
export function evictExpired(
  entries: Record<string, number>,
  now: number = Date.now(),
  ttlMs: number = PREDICTED_SESSION_TTL_MS,
): { byId: Record<string, number>; evicted: string[] } {
  const byId: Record<string, number> = {};
  const evicted: string[] = [];
  for (const [sessionId, predictedAt] of Object.entries(entries)) {
    if (now - predictedAt > ttlMs) {
      evicted.push(sessionId);
    } else {
      byId[sessionId] = predictedAt;
    }
  }
  return { byId, evicted };
}

interface AppState {
  isSidebarOpen: boolean;
  offlineMode: boolean;
  lastSynced: number | null;
  syncStatus: SyncStatusState;
}

interface StoreState {
  user: UserState;
  app: AppState;

  /** Predicted session entries keyed by session id -> last prediction timestamp. */
  predictedSessions: Record<string, number>;

  // Actions
  setUser: (user: Partial<UserState>) => void;
  setPreferences: (prefs: Partial<UserState['preferences']>) => void;
  toggleSidebar: () => void;
  setOfflineMode: (mode: boolean) => void;
  updateSyncTime: () => void;
  /** Record or refresh a predicted session entry (TTL-bounded). */
  recordPredictedSession: (sessionId: string) => void;
  /** Remove predicted sessions older than the TTL. Returns the number evicted. */
  evictStalePredictedSessions: () => number;

  // Entire state replacement (used by sync engine)
  rehydrate: (state: Partial<StoreState>) => void;
}

/**
 * Centralized state manager using Zustand with persistence.
 */
export const useStore = create<StoreState>()(
  stateLogger(
    persist(
      (set) => ({
        user: {
          id: null,
          name: null,
          role: UserRole.GUEST,
          preferences: {
            theme: 'system' as 'light' | 'dark' | 'system',
            language: 'en',
            notifications: true,
            prefetching: true,
          },
        },
        app: {
          isSidebarOpen: true,
          offlineMode: false,
          lastSynced: null,
          syncStatus: 'idle' as SyncStatusState,
        },
        predictedSessions: {},

        setUser: (user: Partial<UserState>) =>
          set((state: StoreState) => ({ user: { ...state.user, ...user } })),

        setPreferences: (prefs: Partial<UserState['preferences']>) =>
          set((state: StoreState) => ({
            user: {
              ...state.user,
              preferences: { ...state.user.preferences, ...prefs },
            },
          })),

        toggleSidebar: () =>
          set((state: StoreState) => ({
            app: { ...state.app, isSidebarOpen: !state.app.isSidebarOpen },
          })),

        setOfflineMode: (mode: boolean) =>
          set((state: StoreState) => ({ app: { ...state.app, offlineMode: mode } })),

        updateSyncTime: () =>
          set((state: StoreState) => ({ app: { ...state.app, lastSynced: Date.now() } })),

        recordPredictedSession: (sessionId: string) =>
          set((state: StoreState) => {
            const now = Date.now();
            // Drop expired entries while we are here to bound memory.
            const pruned = evictExpired(state.predictedSessions, now);
            if (pruned.evicted.length > 0 || !(sessionId in state.predictedSessions)) {
              return {
                predictedSessions: {
                  ...pruned.byId,
                  [sessionId]: now,
                },
              };
            }
            return state;
          }),

        evictStalePredictedSessions: () => {
          let evicted = 0;
          set((state: StoreState) => {
            const pruned = evictExpired(state.predictedSessions, Date.now());
            evicted = pruned.evicted.length;
            return pruned.evicted.length > 0 ? { predictedSessions: pruned.byId } : state;
          });
          return evicted;
        },

        rehydrate: (newState: Partial<StoreState>) =>
          set(
            (state: StoreState) =>
              deepMerge(
                state as unknown as Record<string, unknown>,
                newState as Record<string, unknown>,
              ) as unknown as StoreState,
          ),
      }),
      {
        name: 'teachlink-storage',
        version: PERSISTED_SCHEMA_VERSION,
        migrate: migratePersistedStoreState,
        storage: createJSONStorage(() => persistenceLayer),
        partialize: (state: StoreState) => ({
          user: state.user,
          app: state.app,
          predictedSessions: state.predictedSessions,
        }), // Only persist these fields
      },
    ),
  ),
);

// ---------------------------------------------------------------------------
// Selector memoization
// ---------------------------------------------------------------------------

/** A memoized selector, with a way to drop its cached result. */
export type MemoizedSelector<TArgs extends readonly unknown[], R> = ((...args: TArgs) => R) & {
  /** Forgets the cached inputs and result. */
  clear: () => void;
};

/**
 * Memoizes a derivation by the identity of its inputs.
 *
 * Zustand compares a selector's *result* with `Object.is` to decide whether to
 * re-render. A selector that derives a new array or object — `notifications
 * .filter(...)` — therefore returns a fresh reference on every store update,
 * so every subscriber re-renders whenever any unrelated slice changes, and the
 * filter runs again each time.
 *
 * Caching the last inputs and result fixes both: given the same input
 * references the computation is skipped and the previous reference is
 * returned, so `Object.is` holds and the component does not re-render.
 *
 * Only the most recent call is cached. That is the right size here: a selector
 * is called with the current state, and state moves forward, so a larger cache
 * would retain memory to serve inputs that are not coming back.
 *
 * Arguments are compared with `Object.is`, which makes the memo as cheap as
 * the comparison — it is not a deep equality check, so a caller that rebuilds
 * an equal-but-distinct input on every call gains nothing.
 */
export function memoizeByInputs<TArgs extends readonly unknown[], R>(
  compute: (...args: TArgs) => R,
): MemoizedSelector<TArgs, R> {
  let lastArgs: TArgs | null = null;
  let lastResult!: R;
  let hasResult = false;

  const memoized = ((...args: TArgs): R => {
    if (hasResult && lastArgs !== null && sameArgs(lastArgs, args)) {
      return lastResult;
    }

    lastArgs = args;
    lastResult = compute(...args);
    hasResult = true;
    return lastResult;
  }) as MemoizedSelector<TArgs, R>;

  memoized.clear = () => {
    lastArgs = null;
    hasResult = false;
  };

  return memoized;
}

function sameArgs(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (!Object.is(a[index], b[index])) return false;
  }
  return true;
}
