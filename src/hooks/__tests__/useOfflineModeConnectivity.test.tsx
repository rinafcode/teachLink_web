import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const syncData = vi.fn(async () => ({
  success: true,
  syncedItems: 0,
  conflicts: [],
  errors: [],
  lastSyncTime: new Date().toISOString(),
}));

vi.mock('../../services/offlineSync', () => ({
  OfflineStorage: class {
    async init() {}
    async clearAll() {}
  },
  OfflineSyncService: class {
    syncData = syncData;
    async getSyncStatus() {
      return {
        isSyncing: false,
        pending: 0,
        conflicted: 0,
        resolved: 0,
        deadLetter: 0,
        lastSyncTime: null,
      };
    }
  },
}));

vi.mock('../../store/synchronizationEngine', () => ({
  syncEngine: { recordDrainResult: vi.fn(async () => undefined) },
}));

import { useOfflineMode } from '../useOfflineMode';

const goOffline = () => {
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  window.dispatchEvent(new Event('offline'));
};

const goOnline = () => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  window.dispatchEvent(new Event('online'));
};

beforeEach(() => {
  vi.useFakeTimers();
  syncData.mockClear();
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useOfflineMode connectivity debouncing', () => {
  it('starts from the browser online state', () => {
    const { result } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 100 }));

    expect(result.current.isOnline).toBe(true);
  });

  it('reports going offline once the state holds', async () => {
    const { result } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 100 }));

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.isOnline).toBe(false);
  });

  // Each `online` event used to start a sync that the next `offline` cut
  // short, so the queue never drained and every attempt burned a retry.
  it('does not sync while connectivity is flapping', async () => {
    renderHook(() => useOfflineMode({ connectivityDebounceMs: 500 }));

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(50);
      goOnline();
      await vi.advanceTimersByTimeAsync(50);
      goOffline();
      await vi.advanceTimersByTimeAsync(50);
      goOnline();
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(syncData).not.toHaveBeenCalled();
  });

  it('syncs once when connectivity settles online', async () => {
    const { result } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 100 }));

    await act(async () => {
      await result.current.initializeOfflineMode();
    });

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      goOnline();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(syncData).toHaveBeenCalledTimes(1);
    expect(result.current.isOnline).toBe(true);
  });

  it('does not sync when the settled state is offline', async () => {
    renderHook(() => useOfflineMode({ connectivityDebounceMs: 100 }));

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(syncData).not.toHaveBeenCalled();
  });

  it('flushes the pending state on demand', async () => {
    const { result } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 10_000 }));

    await act(async () => {
      goOffline();
    });

    expect(result.current.isOnline).toBe(true);

    await act(async () => {
      result.current.flushConnectivity();
    });

    expect(result.current.isOnline).toBe(false);
  });

  // A timer firing after unmount would sync against a torn-down service.
  it('cancels a pending transition on unmount', async () => {
    const { unmount } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 500 }));

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(50);
      goOnline();
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(syncData).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', async () => {
    const { unmount } = renderHook(() => useOfflineMode({ connectivityDebounceMs: 100 }));

    unmount();

    await act(async () => {
      goOffline();
      await vi.advanceTimersByTimeAsync(1_000);
      goOnline();
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(syncData).not.toHaveBeenCalled();
  });
});
