'use client';

import { useState, useCallback, useRef } from 'react';

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
  fetchFn: (query: string, cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>,
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

  const search = useCallback(
    async (searchQuery: string, cursor?: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setNextCursor(undefined);
        setHasMore(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { items, nextCursor: next } = await fetchFn(searchQuery, cursor);
        setResults((prev) => (cursor ? [...prev, ...items] : items));
        setNextCursor(next);
        setHasMore(!!next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFn],
  );

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => search(value), debounceMs);
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
  }, []);

  return { query, updateQuery, results, isLoading, error, hasMore, loadMore, reset };
}
