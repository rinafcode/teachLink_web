import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';
import { useAdvancedSearch } from '../useAdvancedSearch';
import { useSearchFilters } from '../useSearchFilters';
import { trackSearch, getPopularQueries, getSearchGaps } from '../../utils/searchUtils';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      replace: replaceMock,
      push: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/search',
    useParams: () => ({}),
  };
});

describe('Search Quality and Performance Improvements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useSearch Hook Callbacks Stability', () => {
    it('does not re-create search query update callbacks when fetchFn reference changes', () => {
      const fetchFn1 = vi.fn().mockResolvedValue({ items: [], nextCursor: undefined });
      const fetchFn2 = vi.fn().mockResolvedValue({ items: [], nextCursor: undefined });

      const { result, rerender } = renderHook(({ fetchFn }) => useSearch(fetchFn), {
        initialProps: { fetchFn: fetchFn1 },
      });

      const initialUpdateQuery = result.current.updateQuery;
      const initialReset = result.current.reset;

      rerender({ fetchFn: fetchFn2 });

      expect(result.current.updateQuery).toBe(initialUpdateQuery);
      expect(result.current.reset).toBe(initialReset);
    });
  });

  describe('useAdvancedSearch Race Condition Protection & History', () => {
    it('discards results from earlier triggered search requests if a newer search request is active', async () => {
      const { result } = renderHook(() => useAdvancedSearch());

      // Trigger search 1
      act(() => {
        result.current.updateSearchText('cairo');
      });

      let promise1: Promise<void> | undefined;
      act(() => {
        promise1 = result.current.performSearch();
      });

      // Instantly trigger search 2
      act(() => {
        result.current.updateSearchText('starknet');
      });

      let promise2: Promise<void> | undefined;
      act(() => {
        promise2 = result.current.performSearch();
      });

      // Fast forward time to resolve the API simulations
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      await act(async () => {
        await Promise.all([promise1, promise2]);
      });

      // The isSearching flag should end up as false since the latest request finished
      expect(result.current.isSearching).toBe(false);
    });

    it('loads existing history from localStorage on initialization', async () => {
      localStorage.setItem('search_history_terms', JSON.stringify(['cairo', 'starknet']));
      
      const { result } = renderHook(() => useAdvancedSearch());
      
      await act(async () => {
        await vi.runAllTimersAsync();
      });
      
      expect(result.current.history).toEqual(['cairo', 'starknet']);
    });
  });

  describe('useSearchFilters Debounced URL Sync', () => {
    it('debounces router replace changes when continuous filters are applied', async () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => {
        result.current.setFilters({ priceRange: 50 });
      });

      // Router.replace should not be called immediately because it is debounced by 300ms
      expect(replaceMock).not.toHaveBeenCalled();

      // Advance by 150ms - still shouldn't be called
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(replaceMock).not.toHaveBeenCalled();

      // Advance by another 150ms to reach 300ms
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining('price=50'), { scroll: false });
    });
  });

  describe('localStorage Safe Parsing Utilities', () => {
    it('gracefully recovers and returns empty fallbacks when localStorage analytics are corrupted', () => {
      localStorage.setItem('search_analytics', 'corrupted-invalid-json-string');

      // These functions should not throw exceptions
      expect(() => {
        trackSearch({ query: 'test', timestamp: Date.now(), resultsCount: 0, filtersApplied: [] });
      }).not.toThrow();

      expect(getPopularQueries()).toEqual([]);
      expect(getSearchGaps()).toEqual([]);
    });
  });
});
