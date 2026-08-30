import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineSync, type OfflineSyncStatusSnapshot } from '../useOfflineSync';

const status = (overrides: Partial<OfflineSyncStatusSnapshot> = {}): OfflineSyncStatusSnapshot => ({
  pending: 0,
  conflicted: 0,
  resolved: 0,
  deadLetter: 0,
  ...overrides,
});

const summary = (count: number, oldestFailedAt: string | null = null) => ({
  count,
  byType: count > 0 ? { course_progress: count } : {},
  oldestFailedAt,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useOfflineSync dead-letter surfacing', () => {
  it('starts with an empty dead-letter state', () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.deadLetterCount).toBe(0);
    expect(result.current.hasDeadLetter).toBe(false);
    expect(result.current.deadLetter).toEqual({ count: 0, byType: {}, oldestFailedAt: null });
  });

  // A user arriving with a stuck queue has not triggered a sync yet, so
  // waiting for the next drain to read the queue means they never see it.
  it('reads the dead-letter queue on mount, without a sync', async () => {
    const getDeadLetterSummary = vi.fn().mockResolvedValue(summary(3, '2026-01-02T00:00:00.000Z'));

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { getDeadLetterSummary }),
    );

    await waitFor(() => expect(result.current.deadLetterCount).toBe(3));
    expect(getDeadLetterSummary).toHaveBeenCalledTimes(1);
    expect(result.current.hasDeadLetter).toBe(true);
    expect(result.current.deadLetter.oldestFailedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('reads the conflict status on mount too', async () => {
    const getStatus = vi.fn().mockResolvedValue(status({ pending: 2, conflicted: 1 }));

    const { result } = renderHook(() => useOfflineSync(undefined, getStatus));

    await waitFor(() => expect(result.current.conflictState.pending).toBe(2));
    expect(result.current.conflictState.conflicted).toBe(1);
  });

  it('keeps the count in step with the sync status', async () => {
    const getStatus = vi.fn().mockResolvedValue(status({ deadLetter: 4 }));

    const { result } = renderHook(() => useOfflineSync(undefined, getStatus));

    await waitFor(() => expect(result.current.deadLetterCount).toBe(4));
    expect(result.current.deadLetter.count).toBe(4);
  });

  it('exposes the breakdown by type', async () => {
    const getDeadLetterSummary = vi.fn().mockResolvedValue({
      count: 2,
      byType: { course_progress: 2 },
      oldestFailedAt: '2026-01-01T00:00:00.000Z',
    });

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { getDeadLetterSummary }),
    );

    await waitFor(() => expect(result.current.deadLetter.byType.course_progress).toBe(2));
  });

  it('refreshes on demand', async () => {
    const getDeadLetterSummary = vi
      .fn()
      .mockResolvedValueOnce(summary(2))
      .mockResolvedValueOnce(summary(0));

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { getDeadLetterSummary }),
    );

    await waitFor(() => expect(result.current.deadLetterCount).toBe(2));

    await act(async () => {
      await result.current.refreshDeadLetter();
    });

    expect(result.current.deadLetterCount).toBe(0);
    expect(result.current.hasDeadLetter).toBe(false);
  });

  it('retries the queue and refreshes afterwards', async () => {
    const retryDeadLetter = vi.fn().mockResolvedValue(2);
    const getDeadLetterSummary = vi
      .fn()
      .mockResolvedValueOnce(summary(2))
      .mockResolvedValue(summary(0));

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { getDeadLetterSummary, retryDeadLetter }),
    );

    await waitFor(() => expect(result.current.deadLetterCount).toBe(2));

    let requeued = 0;
    await act(async () => {
      requeued = await result.current.retryDeadLetterOperations();
    });

    expect(requeued).toBe(2);
    expect(retryDeadLetter).toHaveBeenCalledTimes(1);
    expect(result.current.deadLetterCount).toBe(0);
  });

  it('reports nothing requeued when no retry action was supplied', async () => {
    const { result } = renderHook(() => useOfflineSync());

    let requeued = -1;
    await act(async () => {
      requeued = await result.current.retryDeadLetterOperations();
    });

    expect(requeued).toBe(0);
  });

  // A read that throws must not wedge the UI in a retrying state.
  it('survives a failing dead-letter read', async () => {
    const getDeadLetterSummary = vi.fn().mockRejectedValue(new Error('idb closed'));

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { getDeadLetterSummary }),
    );

    await waitFor(() => expect(getDeadLetterSummary).toHaveBeenCalled());
    expect(result.current.deadLetterCount).toBe(0);
  });

  it('clears the retrying flag after a failed retry', async () => {
    const retryDeadLetter = vi.fn().mockRejectedValue(new Error('nope'));

    const { result } = renderHook(() =>
      useOfflineSync(undefined, undefined, { retryDeadLetter }),
    );

    await act(async () => {
      await result.current.retryDeadLetterOperations();
    });

    expect(result.current.isRetryingDeadLetter).toBe(false);
  });

  it('does nothing on mount when no providers are supplied', () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.deadLetterCount).toBe(0);
    expect(result.current.conflictState).toEqual({ pending: 0, conflicted: 0, resolved: 0 });
  });
});
