import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAbortController } from '../useAbortController';

describe('useAbortController', () => {
  it('returns stable getSignal and abort functions', () => {
    const { result, rerender } = renderHook(() => useAbortController());

    const firstGetSignal = result.current.getSignal;
    const firstAbort = result.current.abort;

    rerender();

    expect(result.current.getSignal).toBe(firstGetSignal);
    expect(result.current.abort).toBe(firstAbort);
  });

  it('generates a fresh signal that can be aborted', () => {
    const { result } = renderHook(() => useAbortController());
    const signal = result.current.getSignal();

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);

    result.current.abort();
    expect(signal.aborted).toBe(true);
  });

  it('aborts the previous signal when getSignal is called again', () => {
    const { result } = renderHook(() => useAbortController());
    const signal1 = result.current.getSignal();
    expect(signal1.aborted).toBe(false);

    const signal2 = result.current.getSignal();
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);
  });

  it('aborts the active signal automatically on unmount', () => {
    const { result, unmount } = renderHook(() => useAbortController());
    const signal = result.current.getSignal();
    expect(signal.aborted).toBe(false);

    unmount();
    expect(signal.aborted).toBe(true);
  });
});
