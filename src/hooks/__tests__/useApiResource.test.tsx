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
});
