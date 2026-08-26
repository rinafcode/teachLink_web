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

export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  threshold = 0,
  rootMargin = '0px 0px 200px 0px',
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Keep a ref in sync with the loading state so the observer callback can
  // read the latest value without being listed as an effect dependency.
  // This prevents the IntersectionObserver from being torn down and recreated
  // on every loading transition.
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const runLoadMore = useCallback(async () => {
    if (loadingRef.current || !hasNextPage) return;

    setLoading(true);
    setError(null);

    try {
      await onLoadMore();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [hasNextPage, onLoadMore]);

  // Keep a stable ref to runLoadMore so the observer effect does not need to
  // list it as a dependency. The ref is updated on every render, meaning the
  // callback inside the observer always calls the latest version.
  const runLoadMoreRef = useRef(runLoadMore);
  useEffect(() => {
    runLoadMoreRef.current = runLoadMore;
  });

  const loadMore = useCallback(() => {
    void runLoadMore();
  }, [runLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        // Read loading from the ref — no need to list it as a dep, so the
        // observer is never recreated just because loading flipped.
        if (first?.isIntersecting && !loadingRef.current) {
          void runLoadMoreRef.current();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
    // loading and runLoadMore intentionally omitted — accessed via refs above.
  }, [hasNextPage, rootMargin, threshold]);

  return { sentinelRef, loading, error, loadMore };
}
