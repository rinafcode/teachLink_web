import { useState, useCallback } from 'react';

/**
 * Hook for handling optimistic UI updates with rollback support.
 */
export const useOptimisticUpdates = <T,>() => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Executes an optimistic update.
   * @param updateFn Function to perform the local state update.
   * @param apiFn Function to perform the actual API call.
   * @param rollbackFn Function to reverse the local state update on failure.
   */
  const executeUpdate = useCallback(async (
    updateFn: () => void,
    apiFn: () => Promise<T>,
    rollbackFn: () => void
  ) => {
    setIsUpdating(true);
    setError(null);

    // 1. Perform optimistic update
    try {
      updateFn();
    } catch (e) {
      console.error('[OptimisticUpdate] Local update failed:', e);
      setIsUpdating(false);
      return;
    }

    // 2. Execute API call
    try {
      const result = await apiFn();
      setIsUpdating(false);
      return result;
    } catch (e) {
      // 3. Rollback on failure
      console.error('[OptimisticUpdate] API call failed, rolling back:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
      rollbackFn();
      setIsUpdating(false);
      throw e;
    }
  }, []);

  return { executeUpdate, isUpdating, error };
};
