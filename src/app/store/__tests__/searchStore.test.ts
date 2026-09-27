import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useSearchStore } from '../searchStore';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

const pushStateMock = vi.fn();
const replaceStateMock = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  localStorageMock.clear();
  useSearchStore.setState({
    searchQuery: '',
    cursor: undefined,
    difficulty: [],
    duration: [0, 20],
    topics: [],
    instructors: [],
    sortBy: 'relevance',
    price: [0, 1000],
    searchHistory: [],
  });

  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, pathname: '/search', search: '' },
    writable: true,
  });

  pushStateMock.mockClear();
  replaceStateMock.mockClear();
  vi.stubGlobal('history', {
    pushState: pushStateMock,
    replaceState: replaceStateMock,
    state: {},
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

describe('searchStore URL sync', () => {
  it('calls pushState when searchQuery changes (significant change)', () => {
    const store = useSearchStore.getState();
    store.setSearchQuery('react');

    expect(pushStateMock).toHaveBeenCalledTimes(1);
    expect(pushStateMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchState: expect.objectContaining({ searchQuery: 'react' }) }),
      '',
      expect.stringContaining('q=react'),
    );
    expect(replaceStateMock).not.toHaveBeenCalled();
  });

  it('calls pushState when difficulty filter changes (significant change)', () => {
    const store = useSearchStore.getState();
    store.setDifficulty(['beginner']);

    expect(pushStateMock).toHaveBeenCalledTimes(1);
    expect(pushStateMock).toHaveBeenCalledWith(
      expect.anything(),
      '',
      expect.stringContaining('difficulty=beginner'),
    );
  });

  it('calls pushState when sortBy changes (significant change)', () => {
    const store = useSearchStore.getState();
    store.setSortBy('rating');

    expect(pushStateMock).toHaveBeenCalledTimes(1);
    expect(pushStateMock).toHaveBeenCalledWith(
      expect.anything(),
      '',
      expect.stringContaining('sort=rating'),
    );
  });

  it('calls replaceState when cursor changes (minor/transient change)', () => {
    const store = useSearchStore.getState();
    store.setCursor('abc123');

    expect(replaceStateMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchState: expect.objectContaining({ cursor: 'abc123' }) }),
      '',
      expect.stringContaining('cursor=abc123'),
    );
    expect(pushStateMock).not.toHaveBeenCalled();
  });

  it('clears cursor on a new search query and uses pushState', () => {
    useSearchStore.setState({ cursor: 'old-cursor' });
    const store = useSearchStore.getState();
    store.setSearchQuery('react');

    expect(pushStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchState: expect.not.objectContaining({ cursor: 'old-cursor' }),
      }),
      '',
      expect.not.stringContaining('cursor'),
    );
    const updatedCursor = useSearchStore.getState().cursor;
    expect(updatedCursor).toBeUndefined();
  });

  it('includes all active filters in the URL on setSearchQuery', () => {
    useSearchStore.setState({
      difficulty: ['intermediate'],
      topics: ['design'],
      sortBy: 'newest',
    });

    const store = useSearchStore.getState();
    store.setSearchQuery('ux');

    const urlArg = pushStateMock.mock.calls[0][2];
    expect(urlArg).toContain('q=ux');
    expect(urlArg).toContain('difficulty=intermediate');
    expect(urlArg).toContain('topics=design');
    expect(urlArg).toContain('sort=newest');
  });

  it('does not include default values in the URL', () => {
    const store = useSearchStore.getState();
    store.setSearchQuery('test');

    const urlArg = pushStateMock.mock.calls[0][2];
    expect(urlArg).toContain('q=test');
    expect(urlArg).not.toContain('sort=');
    expect(urlArg).not.toContain('price=');
    expect(urlArg).not.toContain('duration=');
  });
});

describe('searchStore pushState state payload', () => {
  it('includes full state snapshot in pushState', () => {
    useSearchStore.setState({
      difficulty: ['beginner'],
      topics: ['react'],
      sortBy: 'rating',
    });
    const store = useSearchStore.getState();
    store.setSearchQuery('hooks');

    const stateArg = pushStateMock.mock.calls[0][0];
    expect(stateArg.searchState).toMatchObject({
      searchQuery: 'hooks',
      difficulty: ['beginner'],
      topics: ['react'],
      sortBy: 'rating',
    });
  });
});

describe('searchStore updateFromUrl', () => {
  it('parses search query from URL params', () => {
    const params = new URLSearchParams('q=react');
    useSearchStore.getState().updateFromUrl(params);
    expect(useSearchStore.getState().searchQuery).toBe('react');
  });

  it('parses difficulty from URL params', () => {
    const params = new URLSearchParams('difficulty=beginner,intermediate');
    useSearchStore.getState().updateFromUrl(params);
    expect(useSearchStore.getState().difficulty).toEqual(['beginner', 'intermediate']);
  });

  it('parses cursor from URL params', () => {
    const params = new URLSearchParams('cursor=abc123');
    useSearchStore.getState().updateFromUrl(params);
    expect(useSearchStore.getState().cursor).toBe('abc123');
  });

  it('parses cursor as empty string when present but empty', () => {
    const params = new URLSearchParams('cursor=');
    useSearchStore.getState().updateFromUrl(params);
    expect(useSearchStore.getState().cursor).toBe('');
  });

  it('restores full filter state from URL params', () => {
    const params = new URLSearchParams(
      'q=design&difficulty=advanced&topics=ui,ux&sort=rating&duration=5,15&price=10,500',
    );
    useSearchStore.getState().updateFromUrl(params);
    const state = useSearchStore.getState();
    expect(state.searchQuery).toBe('design');
    expect(state.difficulty).toEqual(['advanced']);
    expect(state.topics).toEqual(['ui', 'ux']);
    expect(state.sortBy).toBe('rating');
    expect(state.duration).toEqual([5, 15]);
    expect(state.price).toEqual([10, 500]);
  });

  it('resets fields to defaults when params are absent', () => {
    useSearchStore.setState({
      searchQuery: 'old',
      difficulty: ['advanced'],
      topics: ['design'],
      sortBy: 'rating',
      cursor: 'abc',
    });

    const params = new URLSearchParams('');
    useSearchStore.getState().updateFromUrl(params);
    const state = useSearchStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.difficulty).toEqual([]);
    expect(state.topics).toEqual([]);
    expect(state.sortBy).toBe('relevance');
    expect(state.cursor).toBeUndefined();
  });
});
