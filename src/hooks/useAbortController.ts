'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Returns a stable getSignal() function. Each call to getSignal() aborts the
 * previous signal and returns a fresh one, so in-flight requests from the last
 * render are cancelled automatically. Everything is cleaned up on unmount.
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getSignal = useCallback((): AbortSignal => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { getSignal };
}
