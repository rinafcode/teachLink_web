'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { buildDedupeKey, dedupe, cancelDedupe } from '@/lib/api/dedupe';
import { useAbortController } from './useAbortController';

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type UseApiOptions = {
  /** Skip the initial fetch (manual trigger only). */
  skip?: boolean;
  /** Extra data included in the dedupe key (e.g. request body). */
  body?: unknown;
};

/**
 * Hook for data fetching with automatic request deduplication.
 *
 * Concurrent calls with the same method + url + body share a single
 * in-flight request instead of firing duplicate network calls.
 */
export function useApi<T>(
  url: string,
  options: RequestInit & UseApiOptions = {},
): ApiState<T> & { refetch: () => void } {
  const { skip = false, body, ...fetchOptions } = options;
  const method = fetchOptions.method ?? 'GET';

  const { getSignal } = useAbortController();

  // Serialize body and fetchOptions values using refs to keep identity stable
  // unless their deep or stringified contents actually change.
  const bodyRef = useRef(body);
  bodyRef.current = body;

  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;

  // Use a stable stringified representation for dependency checks to prevent reference churn
  const serializedBody = JSON.stringify(body);
  const serializedOptions = JSON.stringify(fetchOptions);

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: !skip,
    error: null,
  });

  // Track whether the component is still mounted to avoid state updates after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    const currentBody = bodyRef.current;
    const currentOptions = fetchOptionsRef.current;
    const currentMethod = currentOptions.method ?? 'GET';
    const signal = getSignal();

    const key = buildDedupeKey(currentMethod, url, currentBody);

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const data = await dedupe<T>(key, () =>
        fetch(url, {
          ...currentOptions,
          method: currentMethod,
          signal,
          ...(currentBody ? { body: JSON.stringify(currentBody) } : {}),
        }).then((res) => {
          if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
          return res.json() as Promise<T>;
        }),
      );

      if (mountedRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  }, [url, method, serializedBody, serializedOptions, getSignal]);

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
    return () => {
      cancelDedupe(buildDedupeKey(method, url, bodyRef.current));
    };
  }, [skip, fetchData, method, url]);

  return { ...state, refetch: fetchData };
}
