import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '../useSearch';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useSearch hook performance and quality', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debounces search calls and executes after timeout', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue({ items: [{ id: '1', title: 'Test', type: 'post' }] });
    const { result } = renderHook(() => useSearch(fetchFn, { debounceMs: 50 }));

    act(() => {
      result.current.updateQuery('a');
    });
    act(() => {
      result.current.updateQuery('ab');
    });

    expect(fetchFn).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith('ab', undefined, expect.any(AbortSignal));
  });

  it('cancels previous fetch requests when a new search triggers', async () => {
    let abortSignal1: AbortSignal | undefined;
    let abortSignal2: AbortSignal | undefined;

    const fetchFn = vi.fn().mockImplementation((query, cursor, signal) => {
      if (query === 'first') abortSignal1 = signal;
      if (query === 'second') abortSignal2 = signal;
      return new Promise((resolve) => {
        setTimeout(() => resolve({ items: [] }), 50);
      });
    });

    const { result } = renderHook(() => useSearch(fetchFn, { debounceMs: 10 }));

    // Trigger first search
    act(() => {
      result.current.updateQuery('first');
    });

    // Wait for first debounce to fire
    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    // Before it resolves, trigger second search
    act(() => {
      result.current.updateQuery('second');
    });

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    // Verify first request was aborted
    expect(abortSignal1?.aborted).toBe(true);
    expect(abortSignal2?.aborted).toBe(false);
  });

  it('caches results and returns them immediately on subsequent identical queries', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue({ items: [{ id: '2', title: 'Cache Test', type: 'post' }] });
    const { result } = renderHook(() => useSearch(fetchFn, { debounceMs: 10 }));

    // Initial search
    act(() => {
      result.current.updateQuery('cacheme');
    });

    await waitFor(() => {
      expect(result.current.results.length).toBe(1);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Clear query
    act(() => {
      result.current.reset();
    });

    // Search same term again
    act(() => {
      result.current.updateQuery('cacheme');
    });

    // Should resolve immediately without waiting for debounce/fetch
    expect(result.current.results.length).toBe(1);
    expect(fetchFn).toHaveBeenCalledTimes(1); // Still 1, didn't call fetch again
  });
});
