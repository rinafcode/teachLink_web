/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Development tools and debugging utilities for state management.
 */

/**
 * Middleware or utility to log state transitions in development.
 */
import { StateCreator } from 'zustand';

/**
 * Middleware or utility to log state transitions in development.
 */
export const stateLogger = <T extends object>(
  config: StateCreator<T, any, any>
): StateCreator<T, any, any> => (set, get, api) =>
    config(
      (args) => {
        if (process.env.NODE_ENV === 'development') {
          console.group('%c [State Action]', 'color: #00bcd4; font-weight: bold;');
          console.log('Action:', args);
          console.log('Previous State:', get());
          set(args);
          console.log('Next State:', get());
          console.groupEnd();
        } else {
          set(args);
        }
      },
      get,
      api
    );

/**
 * Utility to inspect the current state in the console.
 */
export const inspectState = (store: any) => {
  if (typeof window !== 'undefined') {
    (window as any).__TEACHLINK_STATE__ = store.getState;
    console.log('[DevTools] State inspector attached to window.__TEACHLINK_STATE__');
  }
};
