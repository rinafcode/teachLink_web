import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sanitizeString,
  validateStringArray,
  isValidDifficulty,
  isValidSortOption,
  validateNumericRange,
} from '@/utils/searchUtils';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SortOption = 'relevance' | 'newest' | 'rating' | 'price';

interface FilterState {
  difficulty: Difficulty[];
  duration: [number, number];
  topics: string[];
  instructors: string[];
  sortBy: SortOption;
  price: [number, number];
}

interface SearchStore extends FilterState {
  setDifficulty: (difficulty: Difficulty[]) => void;
  setDuration: (duration: [number, number]) => void;
  setTopics: (topics: string[]) => void;
  setInstructors: (instructors: string[]) => void;
  setSortBy: (sortBy: SortOption) => void;
  setPrice: (price: [number, number]) => void;
  clearFilters: () => void;
  syncWithUrl: () => void;
  updateFromUrl: (params: URLSearchParams) => void;
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

const initialState: FilterState = {
  difficulty: [],
  duration: [0, 20],
  topics: [],
  instructors: [],
  sortBy: 'relevance',
  price: [0, 1000],
};

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      searchHistory: [],
      setDifficulty: (difficulty) => set({ difficulty }),
      setDuration: (duration) => set({ duration }),
      setTopics: (topics) => set({ topics }),
      setInstructors: (instructors) => set({ instructors }),
      setSortBy: (sortBy) => set({ sortBy }),
      setPrice: (price) => set({ price }),
      clearFilters: () => set(initialState),
      addToSearchHistory: (term: string) => {
        if (!term.trim()) return;

        const current = get().searchHistory;
        const updated = [term, ...current.filter((item) => item !== term)].slice(0, 10); // Keep last 10 searches

        set({ searchHistory: updated });
      },
      clearSearchHistory: () => set({ searchHistory: [] }),
      syncWithUrl: () => {
        const params = new URLSearchParams(window.location.search);
        const state = get();

        if (state.difficulty.length) {
          params.set('difficulty', state.difficulty.join(','));
        }
        if (
          state.duration[0] !== initialState.duration[0] ||
          state.duration[1] !== initialState.duration[1]
        ) {
          params.set('duration', `${state.duration[0]},${state.duration[1]}`);
        }
        if (state.topics.length) {
          params.set('topics', state.topics.join(','));
        }
        if (state.instructors.length) {
          params.set('instructors', state.instructors.join(','));
        }
        if (state.sortBy !== initialState.sortBy) {
          params.set('sort', state.sortBy);
        }
        if (state.price[0] !== initialState.price[0] || state.price[1] !== initialState.price[1]) {
          params.set('price', `${state.price[0]},${state.price[1]}`);
        }

        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`,
        );
      },
      updateFromUrl: (params) => {
        const newState = { ...initialState };

        const difficulty = params.get('difficulty');
        if (difficulty) {
          const validated = difficulty
            .split(',')
            .map(sanitizeString)
            .filter(isValidDifficulty);
          if (validated.length) newState.difficulty = validated;
        }

        const duration = params.get('duration');
        if (duration) {
          const parts = duration.split(',').map(Number);
          const validated = validateNumericRange(parts[0], parts[1], 0, 100);
          if (validated) newState.duration = validated;
        }

        const topics = params.get('topics');
        if (topics) {
          const validated = validateStringArray(topics.split(','));
          if (validated.length) newState.topics = validated;
        }

        const instructors = params.get('instructors');
        if (instructors) {
          const validated = validateStringArray(instructors.split(','));
          if (validated.length) newState.instructors = validated;
        }

        const sort = params.get('sort');
        if (sort) {
          const sanitized = sanitizeString(sort);
          if (isValidSortOption(sanitized)) newState.sortBy = sanitized;
        }

        const price = params.get('price');
        if (price) {
          const parts = price.split(',').map(Number);
          const validated = validateNumericRange(parts[0], parts[1], 0, 10000);
          if (validated) newState.price = validated;
        }

        set(newState);
      },
    }),
    {
      name: 'search-filters',
    },
  ),
);
