import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistenceLayer } from './persistenceLayer';
import { deepMerge } from '../utils/stateUtils';
import { stateLogger } from './devTools';
import { UserRole } from '../types/api';

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
