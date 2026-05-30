'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBatcher } from '@/lib/api/batch';
import type { HelpArticle } from '@/app/api/help/route';
import type { BatchRequest, BatchResponse } from '@/lib/api/batch';

export type { HelpArticle };

export interface UseHelpDocumentationResult {
  articles: HelpArticle[];
  loading: boolean;
  error: string | null;
  /** Fetch additional articles by id on demand */
  fetchArticles: (ids: string[]) => void;
}

/** Shared batcher instance – created once per module load */
const helpBatcher = createBatcher<HelpArticle>({
  debounceMs: 10,
  maxBatchSize: 20,
  executor: async (requests: BatchRequest[]) => {
    const res = await fetch('/api/help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });
    if (!res.ok) throw new Error(`Help API error: ${res.status}`);
    const json = await res.json();
    return json.responses as BatchResponse[];
  },
});

/**
 * useHelpDocumentation
 *
 * Fetches one or more help articles via the shared request batcher so that
 * multiple components mounting simultaneously share a single network call.
 *
 * @param articleIds - Article ids to load on mount (optional)
 */
export function useHelpDocumentation(articleIds: string[] = []): UseHelpDocumentationResult {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchArticles = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setLoading(true);
    setError(null);

    const promises = ids.map((id) =>
      helpBatcher.queue({ id, path: id }),
    );

    Promise.allSettled(promises).then((results) => {
      if (!mountedRef.current) return;

      const fetched: HelpArticle[] = [];
      let firstError: string | null = null;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          fetched.push(result.value);
        } else if (result.status === 'rejected' && !firstError) {
          firstError = result.reason instanceof Error ? result.reason.message : String(result.reason);
        }
      }

      setArticles((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newOnes = fetched.filter((a) => !existingIds.has(a.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
      if (firstError) setError(firstError);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (articleIds.length > 0) {
      fetchArticles(articleIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleIds.join(',')]);

  return { articles, loading, error, fetchArticles };
}
