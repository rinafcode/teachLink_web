'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAdvancedSearch } from './useAdvancedSearch';
import type { SearchFilters, SearchQuery } from '../utils/searchUtils';

/**
 * URL param keys — kept in one place so renaming is a one-line change.
 */
const PARAM = {
  query: 'q',
  sort: 'sort',
  types: 'types',
  topics: 'topics',
  difficulty: 'difficulty',
  priceMin: 'priceMin',
  priceMax: 'priceMax',
  rating: 'rating',
  page: 'page',
} as const;

/** Default values that should be omitted from the URL to keep it clean. */
const DEFAULTS = {
  sort: 'relevance',
  priceMin: 0,
  priceMax: 500,
  page: 1,
} as const;

// ---------------------------------------------------------------------------
// Serialise / deserialise helpers
// ---------------------------------------------------------------------------

function filtersToParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  const { text, filters, sortBy, page } = query;

  if (text) params.set(PARAM.query, text);
  if (sortBy && sortBy !== DEFAULTS.sort) params.set(PARAM.sort, sortBy);

  const nonAllTypes = filters.types.filter((t) => t !== 'all');
  if (nonAllTypes.length) params.set(PARAM.types, nonAllTypes.join(','));
  if (filters.topics.length) params.set(PARAM.topics, filters.topics.join(','));
  if (filters.difficulty.length) params.set(PARAM.difficulty, filters.difficulty.join(','));

  if (filters.priceRange[0] !== DEFAULTS.priceMin)
    params.set(PARAM.priceMin, String(filters.priceRange[0]));
  if (filters.priceRange[1] !== DEFAULTS.priceMax)
    params.set(PARAM.priceMax, String(filters.priceRange[1]));

  if (filters.rating !== null && filters.rating !== undefined)
    params.set(PARAM.rating, String(filters.rating));

  if (page && page !== DEFAULTS.page) params.set(PARAM.page, String(page));

  return params;
}

function paramsToQueryPatch(
  searchParams: URLSearchParams,
): Partial<SearchQuery> & { filters: Partial<SearchFilters> } {
  const text = searchParams.get(PARAM.query) ?? '';
  const sortBy = (searchParams.get(PARAM.sort) ?? DEFAULTS.sort) as SearchQuery['sortBy'];
  const page = searchParams.get(PARAM.page) ? Number(searchParams.get(PARAM.page)) : DEFAULTS.page;

  const typesRaw = searchParams.get(PARAM.types);
  const types: SearchFilters['types'] = typesRaw
    ? (typesRaw.split(',').filter(Boolean) as SearchFilters['types'])
    : ['all'];

  const topics = searchParams.get(PARAM.topics)?.split(',').filter(Boolean) ?? [];
  const difficulty = searchParams.get(PARAM.difficulty)?.split(',').filter(Boolean) ?? [];

  const priceMin = searchParams.get(PARAM.priceMin)
    ? Number(searchParams.get(PARAM.priceMin))
    : DEFAULTS.priceMin;
  const priceMax = searchParams.get(PARAM.priceMax)
    ? Number(searchParams.get(PARAM.priceMax))
    : DEFAULTS.priceMax;

  const ratingRaw = searchParams.get(PARAM.rating);
  const rating = ratingRaw ? Number(ratingRaw) : null;

  return {
    text,
    sortBy,
    page,
    filters: { types, topics, difficulty, priceRange: [priceMin, priceMax], rating, dateRange: null },
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useSearchState
 *
 * Wraps `useAdvancedSearch` and adds:
 *  - URL ↔ state synchronisation (read on mount / external navigation, write on every change)
 *  - A shareable URL getter
 *  - Re-exports everything from useAdvancedSearch so callers only need this one hook
 *
 * Persistence strategy:
 *  1. On mount, URL params are the source of truth — they initialise the search state.
 *  2. Every state change is pushed to the URL via `router.replace` (no history entry added).
 *  3. Browser back/forward restores the URL, which triggers a re-sync into state.
 */
export const useSearchState = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const advancedSearch = useAdvancedSearch();
  const { query, updateSearchText, updateFilters, updateSort, performSearch } = advancedSearch;

  /**
   * Ref guards against the hook writing to the URL triggering an immediate
   * read-back that would duplicate state updates.
   */
  const isSyncingToUrl = useRef(false);

  // -------------------------------------------------------------------------
  // 1. Initialise from URL on first render
  // -------------------------------------------------------------------------
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    if (!searchParams) return;
    const patch = paramsToQueryPatch(searchParams);

    if (patch.text) updateSearchText(patch.text);
    if (patch.filters) updateFilters(patch.filters as Partial<SearchFilters>);
    if (patch.sortBy) updateSort(patch.sortBy as SearchQuery['sortBy']);

    // Auto-run the search if URL already had a query or active filters
    const hasActiveState =
      !!patch.text ||
      (patch.filters.types ?? []).some((t) => t !== 'all') ||
      (patch.filters.topics ?? []).length > 0 ||
      (patch.filters.difficulty ?? []).length > 0;

    if (hasActiveState) {
      // Defer one tick so state setters above have settled
      setTimeout(() => performSearch(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // -------------------------------------------------------------------------
  // 2. Sync state → URL whenever query changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hasHydrated.current) return;

    const params = filtersToParams(query);
    const nextSearch = params.toString();
    const currentSearch = searchParams?.toString() ?? '';

    if (nextSearch === currentSearch) return;

    isSyncingToUrl.current = true;
    router.replace(
      nextSearch ? `${pathname ?? ''}?${nextSearch}` : (pathname ?? '/'),
      { scroll: false },
    );
  }, [query, pathname, router, searchParams]);

  // -------------------------------------------------------------------------
  // 3. Sync URL → state on external navigation (browser back/forward)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isSyncingToUrl.current) {
      isSyncingToUrl.current = false;
      return;
    }

    if (!searchParams) return;
    const patch = paramsToQueryPatch(searchParams);

    // Only update fields that actually differ to avoid re-render loops
    if (patch.text !== query.text) updateSearchText(patch.text ?? '');
    if (patch.sortBy && patch.sortBy !== query.sortBy)
      updateSort(patch.sortBy as SearchQuery['sortBy']);
    if (patch.filters) updateFilters(patch.filters as Partial<SearchFilters>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Share helper — returns the current canonical URL for sharing
  // -------------------------------------------------------------------------
  const getShareableUrl = useCallback((): string => {
    const params = filtersToParams(query);
    const base =
      typeof window !== 'undefined'
        ? `${window.location.origin}${pathname ?? ''}`
        : pathname ?? '';
    return params.toString() ? `${base}?${params.toString()}` : base;
  }, [query, pathname]);

  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      return true;
    } catch {
      return false;
    }
  }, [getShareableUrl]);

  return {
    ...advancedSearch,
    getShareableUrl,
    copyShareableUrl,
  };
};