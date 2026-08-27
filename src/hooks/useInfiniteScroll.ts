import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseInfiniteScrollOptions {
  /**
   * Called when the sentinel element becomes visible. Should load the next
   * page and resolve/reject. The hook tracks `loading` state internally.
   */
  onLoadMore: () => Promise<void> | void;
  /** Stop observing once this is true (no more pages to fetch). */
  hasNextPage: boolean;
  /** Fraction of the sentinel that must be visible before callback fires. */
  threshold?: number;
  /**
   * Margin around the root (viewport). Use negative values to pre-load before
   * the sentinel actually enters the viewport.
   */
  rootMargin?: string;
}

export interface UseInfiniteScrollReturn {
  /** Attach this ref to the sentinel element at the bottom of your list. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** True while `onLoadMore` is executing. */
  loading: boolean;
  /** Any error thrown by `onLoadMore`. Cleared automatically on the next call. */
  error: unknown;
  /** Manually trigger a load (e.g. from a "Load more" button). */
  loadMore: () => void;
}

// Minimum interval between page loads to prevent duplicate requests.
const THROTTLE_MS = 500;

export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  threshold = 0,
  rootMargin = '0px 0px 200px 0px',
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const runLoadMore = useCallback(async () => {
    const now = Date.now();
    if (loadingRef.current || !hasNextPage || now - lastLoadTimeRef.current < THROTTLE_MS) return;

    loadingRef.current = true;
    lastLoadTimeRef.current = now;
    setLoading(true);
    setError(null);

    try {
      await onLoadMore();
    } catch (err) {
      setError(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasNextPage, onLoadMore]);

  // Keep a ref in sync with the latest runLoadMore so the observer callback can
  // always call the current version without being a dependency.
  const runLoadMoreRef = useRef(runLoadMore);
  useEffect(() { runLoadMoreRef.current = runLoadMore; });

  const loadMore = useCallback(() => {
    void runLoadMore();
  }, [runLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !loadingRef.current) {
          void runLoadMoreRef.current();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, rootMargin, threshold]);

  return { sentinelRef, loading, error, loadMore };
}
