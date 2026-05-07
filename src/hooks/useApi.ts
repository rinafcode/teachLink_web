'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { buildDedupeKey, dedupe, cancelDedupe } from '@/lib/api/dedupe';

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
    const key = buildDedupeKey(method, url, body);

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const data = await dedupe<T>(key, () =>
        fetch(url, {
          ...fetchOptions,
          method,
          ...(body ? { body: JSON.stringify(body) } : {}),
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
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  }, [url, method, body]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
    return () => {
      cancelDedupe(buildDedupeKey(method, url, body));
    };
  }, [skip, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: fetchData };
}
