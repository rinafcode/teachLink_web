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
  searchQuery: string;
  cursor: string | undefined;
  setSearchQuery: (query: string) => void;
  setCursor: (cursor: string | undefined) => void;
  setDifficulty: (difficulty: Difficulty[]) => void;
  setDuration: (duration: [number, number]) => void;
  setTopics: (topics: string[]) => void;
  setInstructors: (instructors: string[]) => void;
  setSortBy: (sortBy: SortOption) => void;
  setPrice: (price: [number, number]) => void;
  clearFilters: () => void;
  syncWithUrl: (options?: { push?: boolean }) => void;
  updateFromUrl: (params: URLSearchParams) => void;
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

const initialFilterState: FilterState = {
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
      ...initialFilterState,
      searchQuery: '',
      cursor: undefined,
      searchHistory: [],

      setSearchQuery: (query) => {
        set({ searchQuery: query, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setCursor: (cursor) => {
        set({ cursor });
        get().syncWithUrl({ push: false });
      },

      setDifficulty: (difficulty) => {
        set({ difficulty, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setDuration: (duration) => {
        set({ duration, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setTopics: (topics) => {
        set({ topics, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setInstructors: (instructors) => {
        set({ instructors, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setSortBy: (sortBy) => {
        set({ sortBy, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      setPrice: (price) => {
        set({ price, cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      clearFilters: () => {
        set({ ...initialFilterState, searchQuery: '', cursor: undefined });
        get().syncWithUrl({ push: true });
      },

      addToSearchHistory: (term: string) => {
        if (!term.trim()) return;

        const current = get().searchHistory;
        const updated = [term, ...current.filter((item) => item !== term)].slice(0, 10);

        set({ searchHistory: updated });
      },

      clearSearchHistory: () => set({ searchHistory: [] }),

      syncWithUrl: (options = { push: true }) => {
        const params = new URLSearchParams(window.location.search);
        const state = get();

        if (state.searchQuery) {
          params.set('q', state.searchQuery);
        }
        if (state.difficulty.length) {
          params.set('difficulty', state.difficulty.join(','));
        }
        if (
          state.duration[0] !== initialFilterState.duration[0] ||
          state.duration[1] !== initialFilterState.duration[1]
        ) {
          params.set('duration', `${state.duration[0]},${state.duration[1]}`);
        }
        if (state.topics.length) {
          params.set('topics', state.topics.join(','));
        }
        if (state.instructors.length) {
          params.set('instructors', state.instructors.join(','));
        }
        if (state.sortBy !== initialFilterState.sortBy) {
          params.set('sort', state.sortBy);
        }
        if (
          state.price[0] !== initialFilterState.price[0] ||
          state.price[1] !== initialFilterState.price[1]
        ) {
          params.set('price', `${state.price[0]},${state.price[1]}`);
        }
        if (state.cursor) {
          params.set('cursor', state.cursor);
        }

        const url = `${window.location.pathname}${
          params.toString() ? `?${params.toString()}` : ''
        }`;

        if (options.push) {
          window.history.pushState({ searchState: { ...state } }, '', url);
        } else {
          window.history.replaceState({ searchState: { ...state } }, '', url);
        }
      },

      updateFromUrl: (params) => {
        const newState: Record<string, unknown> = {};

        newState.searchQuery = params.get('q') ?? '';

        const difficulty = params.get('difficulty');
        if (difficulty) {
          const validated = difficulty.split(',').map(sanitizeString).filter(isValidDifficulty);
          if (validated.length) newState.difficulty = validated;
        } else {
          newState.difficulty = [];
        }

        const duration = params.get('duration');
        if (duration) {
          const parts = duration.split(',').map(Number);
          const validated = validateNumericRange(parts[0], parts[1], 0, 100);
          if (validated) newState.duration = validated;
        } else {
          newState.duration = [0, 20];
        }

        const topics = params.get('topics');
        if (topics) {
          const validated = validateStringArray(topics.split(','));
          if (validated.length) newState.topics = validated;
        } else {
          newState.topics = [];
        }

        const instructors = params.get('instructors');
        if (instructors) {
          const validated = validateStringArray(instructors.split(','));
          if (validated.length) newState.instructors = validated;
        } else {
          newState.instructors = [];
        }

        const sort = params.get('sort');
        if (sort) {
          const sanitized = sanitizeString(sort);
          if (isValidSortOption(sanitized)) newState.sortBy = sanitized;
        } else {
          newState.sortBy = 'relevance';
        }

        const price = params.get('price');
        if (price) {
          const parts = price.split(',').map(Number);
          const validated = validateNumericRange(parts[0], parts[1], 0, 10000);
          if (validated) newState.price = validated;
        } else {
          newState.price = [0, 1000];
        }

        const cursor = params.get('cursor');
        if (cursor !== null) {
          newState.cursor = cursor;
        } else {
          newState.cursor = undefined;
        }

        set(newState);
      },
    }),
    {
      name: 'search-filters',
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    useSearchStore.getState().updateFromUrl(params);
  });
}
