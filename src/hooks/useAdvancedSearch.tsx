'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  SearchContentType,
  SearchFilters,
  SearchQuery,
  SearchResult,
  trackSearch,
  getSearchSuggestions,
  parseAdvancedQuery,
} from '../utils/searchUtils';

const DEFAULT_FILTERS: SearchFilters = {
  types: ['all'],
  topics: [],
  difficulty: [],
  priceRange: [0, 500],
  dateRange: null,
  rating: null,
};

const DEFAULT_QUERY: SearchQuery = {
  text: '',
  filters: DEFAULT_FILTERS,
  sortBy: 'relevance',
  page: 1,
  limit: 10,
};

/**
 * Custom hook for advanced search operations
 */
export const useAdvancedSearch = () => {
  const [query, setQuery] = useState<SearchQuery>(DEFAULT_QUERY);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = JSON.parse(
        localStorage.getItem('search_history_terms') || '[]',
      ) as string[];
      setHistory(storedHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Persist history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && history.length > 0) {
      localStorage.setItem('search_history_terms', JSON.stringify(history));
    }
  }, [history]);

  const addToHistory = useCallback((term: string) => {
    if (!term || term.trim() === '') return;
    setHistory((prev: string[]) => [term, ...prev.filter((t: string) => t !== term)].slice(0, 10));
  }, []);

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    setQuery((prev: SearchQuery) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1, // Reset page on filter change
    }));
  }, []);

  const updateSort = useCallback((sortBy: SearchQuery['sortBy']) => {
    setQuery((prev: SearchQuery) => ({ ...prev, sortBy, page: 1 }));
  }, []);

  const updateSearchText = useCallback((text: string) => {
    setQuery((prev: SearchQuery) => ({ ...prev, text, page: 1 }));
    setSuggestions(getSearchSuggestions(text));
  }, []);

  const performSearch = useCallback(async () => {
    const hasFilters =
      query.filters.topics.length > 0 ||
      query.filters.types.filter((t: SearchContentType) => t !== 'all').length > 0 ||
      query.filters.difficulty.length > 0;

    if (!query.text && !hasFilters) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Dummy results (Moved up to fix declaration order)
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'post',
          title: 'Understanding Cairo and Starknet',
          description: 'A deep dive into zero-knowledge rollups and the Cairo language.',
          author: 'Alex River',
          topic: 'Coding',
          createdAt: '2025-03-20',
          relevanceScore: 0.95,
          difficulty: 'intermediate',
          rating: 4.8,
        },
        {
          id: '2',
          type: 'course',
          title: 'Mastering Next.js 14',
          description: 'Master the new App Router and Server Components.',
          author: 'Dev Master',
          topic: 'Design',
          createdAt: '2025-03-15',
          relevanceScore: 0.88,
          difficulty: 'beginner',
          price: 49,
          rating: 4.9,
        },
      ];

      // Track analytics
      trackSearch({
        query: query.text,
        timestamp: Date.now(),
        resultsCount: mockResults.length,
        filtersApplied: [
          ...query.filters.types,
          ...query.filters.topics,
          ...query.filters.difficulty,
        ],
      });

      // Parse advanced query
      const parsed = parseAdvancedQuery(query.text);

      setResults(mockResults);
      addToHistory(query.text);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, addToHistory]);

  const clearFilters = useCallback(() => {
    setQuery((prev: SearchQuery) => ({
      ...prev,
      filters: DEFAULT_FILTERS,
      page: 1,
    }));
  }, []);

  return {
    query,
    updateSearchText,
    updateFilters,
    updateSort,
    performSearch,
    clearFilters,
    results,
    isSearching,
    suggestions,
    history,
  };
};
