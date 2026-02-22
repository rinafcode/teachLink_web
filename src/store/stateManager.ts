import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistenceLayer } from './persistenceLayer';
import { deepMerge } from '../utils/stateUtils';
import { stateLogger } from './devTools';

interface UserState {
  id: string | null;
  name: string | null;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

interface AppState {
  isSidebarOpen: boolean;
  offlineMode: boolean;
  lastSynced: number | null;
}

interface StoreState {
  user: UserState;
  app: AppState;
  
  // Actions
  setUser: (user: Partial<UserState>) => void;
  setPreferences: (prefs: Partial<UserState['preferences']>) => void;
  toggleSidebar: () => void;
  setOfflineMode: (mode: boolean) => void;
  updateSyncTime: () => void;
  
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
          preferences: {
            theme: 'light' as 'light' | 'dark',
            language: 'en',
            notifications: true,
          },
        },
        app: {
          isSidebarOpen: true,
          offlineMode: false,
          lastSynced: null,
        },

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
          set((state: StoreState) => ({ app: { ...state.app, isSidebarOpen: !state.app.isSidebarOpen } })),

        setOfflineMode: (mode: boolean) =>
          set((state: StoreState) => ({ app: { ...state.app, offlineMode: mode } })),

        updateSyncTime: () =>
          set((state: StoreState) => ({ app: { ...state.app, lastSynced: Date.now() } })),

        rehydrate: (newState: Partial<StoreState>) =>
          set((state: StoreState) => deepMerge(state as unknown as Record<string, unknown>, newState as Record<string, unknown>) as unknown as StoreState),
      }),
      {
        name: 'teachlink-storage',
        storage: createJSONStorage(() => persistenceLayer),
        partialize: (state: StoreState) => ({
          user: state.user,
          app: state.app,
        }), // Only persist these fields
      }
    )
  )
);
