import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';

const makeObserver = (connected: boolean) => {
  const observe = vi.fn();
  const disconnect = vi.fn();

  const MockObserver = vi.fn().mockImplementation((_cb: IntersectionObserverCallback) => ({
    observe,
    disconnect,
  }));

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: connected ? MockObserver : undefined,
  });

  return { observe, disconnect, MockObserver };
};

describe('useInfiniteScroll', () => {
  it('starts with loading=false', () => {
    makeObserver(true);
    const { result } = renderHook(() =>
      useInfiniteScroll({ onLoadMore: vi.fn(), hasNextPage: true }),
    );
    expect(result.current.loading).toBe(false);
  });

  it('sets loading=true while onLoadMore is pending', async () => {
    makeObserver(true);
    let resolve!: () => void;
    const onLoadMore = () =>
      new Promise<void>((res) => {
        resolve = res;
      });

    const { result } = renderHook(() =>
      useInfiniteScroll({ onLoadMore, hasNextPage: true }),
    );

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loading).toBe(true);
    await act(async () => resolve());
    expect(result.current.loading).toBe(false);
  });

  it('captures errors from onLoadMore', async () => {
    makeObserver(true);
    const onLoadMore = vi.fn().mockRejectedValueOnce(new Error('fetch failed'));

    const { result } = renderHook(() =>
      useInfiniteScroll({ onLoadMore, hasNextPage: true }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(result.current.error).toBeTruthy();
  });

  it('does not call onLoadMore when hasNextPage is false', async () => {
    makeObserver(true);
    const onLoadMore = vi.fn();

    const { result } = renderHook(() =>
      useInfiniteScroll({ onLoadMore, hasNextPage: false }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
