/**
 * Development tools and debugging utilities for state management.
 */

/**
 * Middleware or utility to log state transitions in development.
 */
import { StateCreator } from 'zustand';
import { createLogger } from '@/lib/logging';
const logger = createLogger('DevTools');

/**
 * Middleware or utility to log state transitions in development.
 */
export const stateLogger =
  <T extends object>(config: StateCreator<T, any, any>): StateCreator<T, any, any> =>
  (set, get, api) =>
    config(
      (args) => {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[State Action]', { context: { nextState: args } });
          set(args);
        } else {
          set(args);
        }
      },
      get,
      api,
    );

/**
 * Utility to inspect the current state in the console.
 */
export const inspectState = (store: any) => {
  if (typeof window !== 'undefined') {
    (window as any).__TEACHLINK_STATE__ = store.getState;
  }
};
