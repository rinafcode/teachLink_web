'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLoadingStateOptions {
  /** Minimum time (ms) to show the loading state to prevent flicker. Default: 300 */
  minimumDuration?: number;
  /** Initial loading state. Default: false */
  initialLoading?: boolean;
}

interface UseLoadingStateReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  /** Wrap an async function to automatically manage loading state */
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Hook to manage loading states with minimum display time to prevent UI flicker.
 * Ensures loading indicators are shown for at least `minimumDuration` ms,
 * avoiding jarring flash-of-content for fast operations.
 */
export function useLoadingState(options: UseLoadingStateOptions = {}): UseLoadingStateReturn {
  const { minimumDuration = 300, initialLoading = false } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    if (!startTimeRef.current) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = minimumDuration - elapsed;

    if (remaining <= 0) {
      setIsLoading(false);
      startTimeRef.current = null;
    } else {
      timerRef.current = setTimeout(() => {
        setIsLoading(false);
        startTimeRef.current = null;
      }, remaining);
    }
  }, [minimumDuration]);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        const result = await fn();
        stopLoading();
        return result;
      } catch (error) {
        stopLoading();
        throw error;
      }
    },
    [startLoading, stopLoading],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isLoading, startLoading, stopLoading, withLoading };
}
