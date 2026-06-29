'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
}

interface UseSearchOptions {
  debounceMs?: number;
}

export function useSearch<T extends SearchResult>(
  fetchFn: (
    query: string,
    cursor?: string,
    signal?: AbortSignal,
  ) => Promise<{ items: T[]; nextCursor?: string }>,
  options: UseSearchOptions = {},
) {
  const { debounceMs = 300 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const cache = useRef<Record<string, { items: T[]; nextCursor?: string }>>({});

  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const search = useCallback(async (searchQuery: string, cursor?: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setNextCursor(undefined);
      setHasMore(false);
      return;
    }

    const cacheKey = searchQuery.trim().toLowerCase();

    // Check cache for initial fetch
    if (!cursor && cache.current[cacheKey]) {
      const cached = cache.current[cacheKey];
      setResults(cached.items);
      setNextCursor(cached.nextCursor);
      setHasMore(!!cached.nextCursor);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const { items, nextCursor: next } = await fetchFnRef.current(
        searchQuery,
        cursor,
        abortController.current.signal,
      );

      setResults((prev) => (cursor ? [...prev, ...items] : items));
      setNextCursor(next);
      setHasMore(!!next);

      // Cache initial result
      if (!cursor) {
        cache.current[cacheKey] = { items, nextCursor: next };
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      if (abortController.current && !abortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      const cacheKey = value.trim().toLowerCase();
      // Fast path: if cached, resolve immediately instead of debouncing
      if (cache.current[cacheKey]) {
        search(value);
      } else {
        if (value.trim()) setIsLoading(true);
        debounceTimer.current = setTimeout(() => search(value), debounceMs);
      }
    },
    [search, debounceMs],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && nextCursor) {
      search(query, nextCursor);
    }
  }, [hasMore, isLoading, nextCursor, query, search]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setNextCursor(undefined);
    setHasMore(false);
    setError(null);
    if (abortController.current) {
      abortController.current.abort();
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  return { query, updateQuery, results, isLoading, error, hasMore, loadMore, reset };
}
