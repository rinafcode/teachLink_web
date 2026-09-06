import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';
import { clearDedupeCache } from '@/lib/api/dedupe';

describe('useApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearDedupeCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads data successfully', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ value: 'test-data' }),
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useApi<any>('/api/data'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ value: 'test-data' });
    expect(result.current.error).toBeNull();
  });

  it('sets error state when request fails', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useApi<any>('/api/fail'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Request failed: 500');
  });

  it('aborts the fetch request automatically on unmount', async () => {
    let passedSignal: AbortSignal | undefined;
    const mockFetch = vi.fn(async (url, init) => {
      passedSignal = init?.signal;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ value: 'test' }),
          });
        }, 100);
      });
    });
    vi.stubGlobal('fetch', mockFetch as any);

    const { result, unmount } = renderHook(() => useApi<any>('/api/unmount'));

    // Wait a brief tick to let useEffect trigger fetchData
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(passedSignal).toBeDefined();
    expect(passedSignal?.aborted).toBe(false);

    unmount();

    expect(passedSignal?.aborted).toBe(true);
  });

  it('aborts the previous signal when a dependency changes', async () => {
    const signals: AbortSignal[] = [];
    const mockFetch = vi.fn(async (url, init) => {
      if (init?.signal) {
        signals.push(init.signal);
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ value: url }),
          });
        }, 100);
      });
    });
    vi.stubGlobal('fetch', mockFetch as any);

    const { result, rerender } = renderHook(
      ({ url }) => useApi<any>(url),
      { initialProps: { url: '/api/first' } }
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(signals.length).toBe(1);
    expect(signals[0].aborted).toBe(false);

    // Change dependency URL, triggering a new request
    rerender({ url: '/api/second' });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(signals.length).toBe(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('ignores AbortError and does not update state', async () => {
    const mockFetch = vi.fn(async (url, init) => {
      return new Promise((resolve, reject) => {
        const checkAborted = () => {
          if (init?.signal?.aborted) {
            reject(new DOMException('The user aborted a request.', 'AbortError'));
          } else {
            setTimeout(checkAborted, 10);
          }
        };
        checkAborted();
      });
    });
    vi.stubGlobal('fetch', mockFetch as any);

    const { result, unmount } = renderHook(() => useApi<any>('/api/abort-state'));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.loading).toBe(true);

    unmount();

    // The component should unmount and not trigger state updates with AbortError.
    // We wait to make sure any asynchronous rejection resolves and does not throw uncaught errors.
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});
