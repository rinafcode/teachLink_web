'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface FilterState {
  difficulty: string[];
  topics: string[];
  duration: number;
  priceRange: number;
  sort: string;
  instructor: string;
  searchTerm: string;
  nodeAffinity?: string;
}

export const useSearchFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isInternalNavigationRef = useRef(false);
  const lastSyncedSearchRef = useRef(searchParams?.toString() || '');

  const filtersFromSearchParams = useMemo<FilterState>(
    () => ({
      difficulty: searchParams?.get('difficulty')?.split(',').filter(Boolean) || [],
      topics: searchParams?.get('topics')?.split(',').filter(Boolean) || [],
      duration: searchParams?.get('duration') ? Number(searchParams.get('duration')) : 100,
      priceRange: searchParams?.get('price') ? Number(searchParams.get('price')) : 200,
      sort: searchParams?.get('sort') || 'relevance',
      instructor: searchParams?.get('instructor') || '',
      searchTerm: searchParams?.get('q') || '',
      nodeAffinity: searchParams?.get('affinity') || 'auto',
    }),
    [searchParams],
  );

  const [filters, setFiltersState] = useState<FilterState>(filtersFromSearchParams);

  useEffect(() => {
    if (isInternalNavigationRef.current) {
      isInternalNavigationRef.current = false;
      return;
    }

    const currentSearch = searchParams?.toString() || '';
    if (currentSearch === lastSyncedSearchRef.current) {
      return;
    }
    lastSyncedSearchRef.current = currentSearch;

    setFiltersState((prev) => {
      const next = filtersFromSearchParams;
      const hasChanged =
        prev.duration !== next.duration ||
        prev.priceRange !== next.priceRange ||
        prev.sort !== next.sort ||
        prev.instructor !== next.instructor ||
        prev.searchTerm !== next.searchTerm ||
        prev.nodeAffinity !== next.nodeAffinity ||
        prev.difficulty.join(',') !== next.difficulty.join(',') ||
        prev.topics.join(',') !== next.topics.join(',');

      return hasChanged ? next : prev;
    });
  }, [filtersFromSearchParams, searchParams]);

  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    routerRef.current = router;
    pathnameRef.current = pathname;
    searchParamsRef.current = searchParams;
  }, [router, pathname, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.difficulty && filters.difficulty.length > 0) {
        params.set('difficulty', filters.difficulty.join(','));
      }
      if (filters.topics && filters.topics.length > 0) {
        params.set('topics', filters.topics.join(','));
      }
      if (filters.duration !== 100) {
        params.set('duration', filters.duration.toString());
      }
      if (filters.priceRange !== 200) {
        params.set('price', filters.priceRange.toString());
      }
      if (filters.sort && filters.sort !== 'relevance') {
        params.set('sort', filters.sort);
      }
      if (filters.instructor) {
        params.set('instructor', filters.instructor);
      }
      if (filters.searchTerm) {
        params.set('q', filters.searchTerm);
      }
      if (filters.nodeAffinity && filters.nodeAffinity !== 'auto') {
        params.set('affinity', filters.nodeAffinity);
      }

      const pPathname = pathnameRef.current;
      const pSearchParams = searchParamsRef.current;
      const pRouter = routerRef.current;

      const newUrl = params.toString()
        ? `${pPathname ?? ''}?${params.toString()}`
        : pPathname ?? '/';
      const currentSearch = pSearchParams?.toString() || '';
      const nextSearch = params.toString();

      if (currentSearch === nextSearch) {
        return;
      }

      lastSyncedSearchRef.current = nextSearch;
      isInternalNavigationRef.current = true;
      pRouter.replace(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      difficulty: [],
      topics: [],
      duration: 100,
      priceRange: 200,
      sort: 'relevance',
      instructor: '',
      searchTerm: '',
      nodeAffinity: 'auto',
    });
  }, []);

  return {
    filters,
    setFilters,
    resetFilters,
  };
};
