import { useCallback, useMemo, useState } from 'react';

export interface UsePaginationResult<T> {
  /** Current page (0-indexed), clamped to a valid range for the current item count. */
  page: number;
  /** Total number of pages for the current item count (always >= 1). */
  pageCount: number;
  /** The slice of `items` belonging to the current page. */
  pageItems: T[];
  /** Jump to an arbitrary page; clamped to [0, pageCount - 1]. */
  goToPage: (page: number) => void;
  /** Advance to the next page, if any. */
  nextPage: () => void;
  /** Go back to the previous page, if any. */
  previousPage: () => void;
  /** Reset back to the first page (e.g. after a filter/search change). */
  resetPage: () => void;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

/**
 * Client-side pagination over an already-loaded array. Keeps `page` clamped
 * whenever `items` shrinks (e.g. a filter/search reduces the list) so callers
 * never end up rendering an empty page.
 */
export function usePagination<T>(items: T[], pageSize: number): UsePaginationResult<T> {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  const goToPage = useCallback(
    (target: number) => {
      setPage(Math.max(0, Math.min(target, pageCount - 1)));
    },
    [pageCount],
  );

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, pageCount - 1));
  }, [pageCount]);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetPage = useCallback(() => setPage(0), []);

  return {
    page: safePage,
    pageCount,
    pageItems,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    pageSize,
    totalItems: items.length,
    hasNextPage: safePage < pageCount - 1,
    hasPreviousPage: safePage > 0,
  };
}
