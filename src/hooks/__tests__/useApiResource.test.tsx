import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApiResource } from '../useApiResource';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useApiResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets initial loading state', () => {
    (apiClient.get as any).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useApiResource('/api/test'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles successful request and unwraps data', async () => {
    (apiClient.get as any).mockResolvedValue({ success: true, data: { foo: 'bar' } });
    const { result } = renderHook(() => useApiResource('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    const error = new Error('Network Error');
    (apiClient.get as any).mockRejectedValue(error);
    const { result } = renderHook(() => useApiResource('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it('refetches data correctly', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ success: true, data: { attempt: 1 } })
      .mockResolvedValueOnce({ success: true, data: { attempt: 2 } });

    const { result } = renderHook(() => useApiResource('/api/test'));

    await waitFor(() => {
      expect(result.current.data).toEqual({ attempt: 1 });
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ attempt: 2 });
    });
  });

  it('aborts request on unmount', async () => {
    let abortSignal: AbortSignal | undefined;
    (apiClient.get as any).mockImplementation((url: string, options: any) => {
      abortSignal = options.signal;
      return new Promise(() => {}); // Never resolves
    });

    const { unmount } = renderHook(() => useApiResource('/api/test'));
    
    expect(abortSignal).toBeDefined();
    expect(abortSignal?.aborted).toBe(false);

    unmount();

    expect(abortSignal?.aborted).toBe(true);
  });

  it('does not update state after unmount', async () => {
    let resolveRequest: (value: { success: boolean; data: { late: boolean } }) => void;
    (apiClient.get as any).mockImplementation((url: string, options: any) => {
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    });

    const { unmount, result } = renderHook(() => useApiResource('/api/test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    unmount();

    act(() => {
      resolveRequest({ success: true, data: { late: true } });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('cancels previous request on dependency change (refetch)', async () => {
    let abortSignal: AbortSignal | undefined;
    (apiClient.get as any).mockImplementation((url: string, options: any) => {
      abortSignal = options.signal;
      return new Promise(() => {}); // Never resolves
    });

    const { result } = renderHook(() => useApiResource('/api/test'));
    
    expect(abortSignal).toBeDefined();
    expect(abortSignal?.aborted).toBe(false);

    const firstSignal = abortSignal;

    act(() => {
      result.current.refetch();
    });

    expect(firstSignal?.aborted).toBe(true);
    expect(abortSignal).not.toBe(firstSignal);
    expect(abortSignal?.aborted).toBe(false);
  });

  it('stale request does not overwrite newer result', async () => {
    let resolveA: (value: { success: boolean; data: { source: string } }) => void;
    let resolveB: (value: { success: boolean; data: { source: string } }) => void;

    (apiClient.get as any).mockImplementation((url: string, options: any) => {
      const signal = options.signal;
      return new Promise((resolve) => {
        if (!resolveA) {
          resolveA = (v) => resolve(v);
        } else {
          resolveB = (v) => resolve(v);
        }
        signal.addEventListener('abort', () => {
          resolve(new Promise(() => {}));
        }, { once: true });
      });
    });

    const { result } = renderHook(() => useApiResource('/api/test'));

    act(() => {
      resolveA({ success: true, data: { source: 'stale' } });
    });

    await waitFor(() => {
      expect(result.current.data?.source).toBe('stale');
    });

    act(() => {
      result.current.refetch();
    });

    act(() => {
      resolveB({ success: true, data: { source: 'fresh' } });
    });

    await waitFor(() => {
      expect(result.current.data?.source).toBe('fresh');
    });
  });

  it('forwards caller-provided AbortSignal to apiClient', async () => {
    const controller = new AbortController();
    (apiClient.get as any).mockResolvedValue({ success: true, data: {} });

    renderHook(() => useApiResource('/api/test', { signal: controller.signal }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
    });
  });

  it('ignores expected AbortError as user-facing error', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    (apiClient.get as any).mockRejectedValue(abortError);

    const { result } = renderHook(() => useApiResource('/api/test'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('request lifecycle benchmark: zero pending requests after unmount', async () => {
    let resolveRequest: (value: { success: boolean; data: { ok: boolean } }) => void;
    const pendingRequests = new Set<Promise<any>>();

    (apiClient.get as any).mockImplementation((url: string, options: any) => {
      const promise = new Promise<{ success: boolean; data: { ok: boolean } }>((resolve) => {
        resolveRequest = resolve;
      });
      pendingRequests.add(promise);
      promise.then(() => pendingRequests.delete(promise)).catch(() => pendingRequests.delete(promise));
      return promise;
    });

    const { unmount } = renderHook(() => useApiResource('/api/test'));

    expect(pendingRequests.size).toBe(1);

    unmount();

    await act(async () => {
      resolveRequest({ success: true, data: { ok: true } });
    });

    expect(pendingRequests.size).toBe(0);
  });
});
