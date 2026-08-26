'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  delayMs = 300
): (...args: A) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: A) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}
