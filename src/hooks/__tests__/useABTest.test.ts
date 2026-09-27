import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useABTest } from '../useABTest';

describe('useABTest', () => {
  let localStorageData: Record<string, string> = {};

  beforeEach(() => {
    localStorageData = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageData[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageData[key] = value;
      }),
      clear: vi.fn(() => {
        for (const key in localStorageData) delete localStorageData[key];
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageData[key];
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when given an empty variants array', () => {
    expect(() =>
      renderHook(() =>
        useABTest({
          experimentId: 'test_empty',
          variants: [],
        }),
      ),
    ).toThrow('must have at least one variant');
  });

  it('assigns a single variant deterministically', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-1';
    const { result } = renderHook(() =>
      useABTest({
        experimentId: 'test_single',
        variants: [{ id: 'only', label: 'Only', weight: 1 }],
      }),
    );

    expect(result.current.variant.id).toBe('only');
    expect(result.current.isResolved).toBe(true);
    expect(typeof result.current.trackExposure).toBe('function');
  });

  it('persists assignment across re-renders', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-persist';
    const { result, rerender } = renderHook(() =>
      useABTest({
        experimentId: 'test_persist',
        variants: [
          { id: 'a', label: 'A', weight: 50 },
          { id: 'b', label: 'B', weight: 50 },
        ],
      }),
    );

    const firstVariant = result.current.variant.id;
    rerender();
    expect(result.current.variant.id).toBe(firstVariant);
  });

  it('returns the same variant for the same stored bucket', () => {
    localStorageData['ab_test_anon_id'] = 'test-user-same-bucket';
    localStorageData['ab_test_test_same_bucket'] = '2500';

    const { result: first } = renderHook(() =>
      useABTest({
        experimentId: 'test_same_bucket',
        variants: [
          { id: 'a', label: 'A', weight: 50 },
          { id: 'b', label: 'B', weight: 50 },
        ],
      }),
    );

    const { result: second } = renderHook(() =>
      useABTest({
        experimentId: 'test_same_bucket',
        variants: [
          { id: 'a', label: 'A', weight: 50 },
          { id: 'b', label: 'B', weight: 50 },
        ],
      }),
    );

    expect(first.current.variant.id).toBe(second.current.variant.id);
  });

  it('tracks exposure and stores it in localStorage', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    localStorageData['ab_test_anon_id'] = 'test-user-exposure';
    localStorageData['ab_test_test_exposure'] = '2500';

    const { result } = renderHook(() =>
      useABTest({
        experimentId: 'test_exposure',
        variants: [
          { id: 'control', label: 'Control', weight: 50 },
          { id: 'variant', label: 'Variant', weight: 50 },
        ],
      }),
    );

    result.current.trackExposure();

    expect(localStorageData['ab_test_test_exposure_exposed']).toBeTruthy();
    const exposure = JSON.parse(localStorageData['ab_test_test_exposure_exposed']);
    expect(exposure.variantId).toBe(result.current.variant.id);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.any(CustomEvent),
    );
  });

  it('does not dispatch exposure event twice', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    localStorageData['ab_test_anon_id'] = 'test-user-no-double';
    localStorageData['ab_test_test_no_double'] = '2500';

    const { result } = renderHook(() =>
      useABTest({
        experimentId: 'test_no_double',
        variants: [{ id: 'only', label: 'Only', weight: 1 }],
      }),
    );

    result.current.trackExposure();
    result.current.trackExposure();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
