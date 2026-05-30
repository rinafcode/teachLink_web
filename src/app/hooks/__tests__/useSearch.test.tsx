import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('useSearch investment feature support', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns investment results when the query matches investment content', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search('investment');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.results.investments).toHaveLength(3);
    expect(result.current.results.investments[0].title).toContain('Investment');
    expect(result.current.isLoading).toBe(false);
  });

  it('returns only relevant investment search results for a specific investment query', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search('creators');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.results.investments).toHaveLength(1);
    expect(result.current.results.investments[0].title).toContain('Creators');
    expect(result.current.results.courses).toEqual([]);
    expect(result.current.results.topics).toEqual([]);
  });
});
