'use client';

import { useEffect } from 'react';
import { syncEngine } from '../../store/synchronizationEngine';
import { inspectState } from '../../store/devTools';
import { useStore } from '../../store/stateManager';

/**
 * Component to handle side-effects for state management (Sync, DevTools).
 * This should be rendered once in the root layout.
 */
export const StateManagerIntegration = () => {
  useEffect(() => {
    // 1. Initialize Sync Engine
    // (Constructor already does it, but we ensure it's loaded in the browser)
    console.log('[StateManager] Integration active');

    // 2. Attach DevTools
    inspectState(useStore);

    return () => {
      // 3. Cleanup Sync Engine
      syncEngine.disconnect();
    };
  }, []);

  return null; // This is a headless component
};

export default StateManagerIntegration;
