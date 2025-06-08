import { useCallback, useEffect } from 'react';
import { useSearchStore, Difficulty, SortOption } from '@/store/searchStore';
import { useSearchParams } from 'next/navigation';

export const useSearchFilters = () => {
  const searchParams = useSearchParams();
  const {
    difficulty,
    duration,
    topics,
    instructors,
    sortBy,
    price,
    setDifficulty,
    setDuration,
    setTopics,
    setInstructors,
    setSortBy,
    setPrice,
    clearFilters,
    syncWithUrl,
    updateFromUrl,
  } = useSearchStore();

  // Sync with URL on mount
  useEffect(() => {
    updateFromUrl(searchParams);
  }, [searchParams, updateFromUrl]);

  // Sync URL when filters change
  useEffect(() => {
    syncWithUrl();
  }, [difficulty, duration, topics, instructors, sortBy, price, syncWithUrl]);

  const handleDifficultyChange = useCallback(
    (newDifficulty: Difficulty[]) => {
      setDifficulty(newDifficulty);
    },
    [setDifficulty]
  );

  const handleDurationChange = useCallback(
    (newDuration: [number, number]) => {
      setDuration(newDuration);
    },
    [setDuration]
  );

  const handleTopicsChange = useCallback(
    (newTopics: string[]) => {
      setTopics(newTopics);
    },
    [setTopics]
  );

  const handleInstructorsChange = useCallback(
    (newInstructors: string[]) => {
      setInstructors(newInstructors);
    },
    [setInstructors]
  );

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortBy(newSort);
    },
    [setSortBy]
  );

  const handlePriceChange = useCallback(
    (newPrice: [number, number]) => {
      setPrice(newPrice);
    },
    [setPrice]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return {
    filters: {
      difficulty,
      duration,
      topics,
      instructors,
      sortBy,
      price,
    },
    handlers: {
      handleDifficultyChange,
      handleDurationChange,
      handleTopicsChange,
      handleInstructorsChange,
      handleSortChange,
      handlePriceChange,
      handleClearFilters,
    },
  };
}; 