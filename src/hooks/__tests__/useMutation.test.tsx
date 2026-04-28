/**
 * useMutation – unit tests
 *
 * Covers:
 *  - Initial idle state
 *  - Loading toggles true → false on success
 *  - Data stored after success
 *  - Error stored after rejection; isError set
 *  - Double-submission prevention (concurrent call is a no-op)
 *  - onSuccess / onError / onSettled callbacks
 *  - reset() returns to idle state
 *  - mutateAsync rejects so callers can catch
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation } from '../useMutation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a deferred promise that can be resolved/rejected from outside. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('starts in idle state', () => {
    const { result } = renderHook(() => useMutation(vi.fn()));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── Success path ───────────────────────────────────────────────────────────

  it('sets isLoading=true while in-flight, then resolves with data', async () => {
    const { promise, resolve } = deferred<string>();
    const mutationFn = vi.fn(() => promise);

    const { result } = renderHook(() => useMutation(mutationFn));

    // Kick off without awaiting yet
    act(() => {
      result.current.mutate(undefined as any);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    // Resolve the promise
    await act(async () => {
      resolve('hello');
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toBe('hello');
  });

  it('calls onSuccess with data and variables', async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue(42);

    const { result } = renderHook(() => useMutation(mutationFn, { onSuccess }));

    await act(async () => {
      await result.current.mutateAsync('input' as any);
    });

    expect(onSuccess).toHaveBeenCalledWith(42, 'input');
  });

  it('calls onSettled after success', async () => {
    const onSettled = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue('ok');

    const { result } = renderHook(() => useMutation(mutationFn, { onSettled }));

    await act(async () => {
      await result.current.mutateAsync(undefined as any);
    });

    expect(onSettled).toHaveBeenCalledWith('ok', null, undefined);
  });

  // ── Error path ─────────────────────────────────────────────────────────────

  it('sets isError=true and stores error on rejection', async () => {
    const err = new Error('boom');
    const mutationFn = vi.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate(undefined as any);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(err);
    expect(result.current.data).toBeNull();
  });

  it('calls onError with the error and variables', async () => {
    const onError = vi.fn();
    const err = new Error('oops');
    const mutationFn = vi.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useMutation(mutationFn, { onError }));

    await act(async () => {
      await result.current.mutate('payload' as any);
    });

    expect(onError).toHaveBeenCalledWith(err, 'payload');
  });

  it('calls onSettled after error', async () => {
    const onSettled = vi.fn();
    const err = new Error('fail');
    const mutationFn = vi.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useMutation(mutationFn, { onSettled }));

    await act(async () => {
      await result.current.mutate(undefined as any);
    });

    expect(onSettled).toHaveBeenCalledWith(null, err, undefined);
  });

  it('mutateAsync rejects so callers can catch', async () => {
    const err = new Error('reject me');
    const mutationFn = vi.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useMutation(mutationFn));

    await expect(
      act(() => result.current.mutateAsync(undefined as any)),
    ).rejects.toThrow('reject me');
  });

  // ── Double-submission prevention ───────────────────────────────────────────

  it('ignores concurrent mutate calls while in-flight', async () => {
    const { promise, resolve } = deferred<string>();
    const mutationFn = vi.fn(() => promise);

    const { result } = renderHook(() => useMutation(mutationFn));

    // First call
    act(() => {
      result.current.mutate(undefined as any);
    });

    // Second call – should be a no-op because inFlightRef is true
    act(() => {
      result.current.mutate(undefined as any);
    });

    await act(async () => {
      resolve('done');
      await promise;
    });

    // mutationFn must only have been called once
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(result.current.isSuccess).toBe(true);
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  it('reset() returns state to idle after success', async () => {
    const mutationFn = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutateAsync(undefined as any);
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('reset() clears error state', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate(undefined as any);
    });

    expect(result.current.isError).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── Non-Error rejection ────────────────────────────────────────────────────

  it('wraps non-Error rejections into an Error object', async () => {
    const mutationFn = vi.fn().mockRejectedValue('string rejection');
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate(undefined as any);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string rejection');
  });
});
