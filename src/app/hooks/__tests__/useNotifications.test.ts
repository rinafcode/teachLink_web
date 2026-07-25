/**
 * useNotifications – unit tests
 *
 * Focuses on the refactored clearNotification (delegates to store action)
 * and basic hook behaviour.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNotifications } from '../useNotifications';
import { useNotificationStore } from '@/app/store/notificationStore';
import { AppNotification } from '@/lib/notifications/types';

// ─── Mock localStorage ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  localStorageMock.clear();
  useNotificationStore.setState({ notifications: [] });
}

async function flushHookEffects() {
  await act(async () => {});
  await act(async () => {});
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useNotifications', () => {
  beforeEach(resetStore);
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetStore();
  });

  // ── clearNotification ──────────────────────────────────────────────────────

  it('clearNotification removes the notification via the store action', () => {
    const { result } = renderHook(() => useNotifications());

    let id: string;
    act(() => {
      const n = result.current.sendNotification({ message: 'to remove' });
      id = n.id;
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.clearNotification(id);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clearNotification persists removal to localStorage', () => {
    const { result } = renderHook(() => useNotifications());

    let id: string;
    act(() => {
      const n = result.current.sendNotification({ message: 'persist test' });
      id = n.id;
    });

    act(() => {
      result.current.clearNotification(id);
    });

    const stored = JSON.parse(localStorageMock.getItem('notifications_v1') ?? '[]');
    expect(stored).toHaveLength(0);
  });

  it('clearNotification does not remove other notifications', () => {
    const { result } = renderHook(() => useNotifications());

    let idA: string;
    let idB: string;
    act(() => {
      idA = result.current.sendNotification({ message: 'keep' }).id;
      idB = result.current.sendNotification({ message: 'remove' }).id;
    });

    act(() => {
      result.current.clearNotification(idB);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe(idA);
  });

  // ── markAsRead ─────────────────────────────────────────────────────────────

  it('markAsRead marks the correct notification as read', () => {
    const { result } = renderHook(() => useNotifications());

    let id: string;
    act(() => {
      id = result.current.sendNotification({ message: 'mark me' }).id;
    });

    act(() => {
      result.current.markAsRead(id);
    });

    const n = result.current.notifications.find((x) => x.id === id);
    expect(n?.read).toBe(true);
  });

  // ── unreadCount ────────────────────────────────────────────────────────────

  it('unreadCount reflects the number of unread notifications', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.sendNotification({ message: 'a' });
      result.current.sendNotification({ message: 'b' });
    });

    expect(result.current.unreadCount).toBe(2);

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
  });

  // ── preferences heartbeat ─────────────────────────────────────────────────

  it('starts a preferences heartbeat and persists the liveness payload', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));

    const { result } = renderHook(() =>
      useNotifications({
        userId: 'heartbeat-user',
        preferencesHeartbeatIntervalMs: 1000,
        preferencesHeartbeatStaleAfterMs: 3000,
      }),
    );

    await flushHookEffects();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.preferencesHeartbeat.status).toBe('online');
    expect(result.current.preferencesHeartbeat.lastBeatAt).toBe('2026-06-24T12:00:00.000Z');

    const stored = JSON.parse(
      localStorageMock.getItem('notification_preferences_heartbeat_v1') ?? 'null',
    );
    expect(stored).toMatchObject({
      userId: 'heartbeat-user',
      lastBeatAt: '2026-06-24T12:00:00.000Z',
      intervalMs: 1000,
      staleAfterMs: 3000,
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.preferencesHeartbeat.lastBeatAt).toBe('2026-06-24T12:00:01.000Z');
  });

  it('marks an old preferences heartbeat as stale when refreshed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:10.000Z'));

    localStorageMock.setItem(
      'notification_preferences_heartbeat_v1',
      JSON.stringify({
        userId: 'heartbeat-user',
        lastBeatAt: '2026-06-24T12:00:00.000Z',
        intervalMs: 1000,
        staleAfterMs: 3000,
      }),
    );

    const { result } = renderHook(() =>
      useNotifications({
        userId: 'heartbeat-user',
        enablePreferencesHeartbeat: false,
        preferencesHeartbeatIntervalMs: 1000,
        preferencesHeartbeatStaleAfterMs: 3000,
      }),
    );

    act(() => {
      result.current.refreshPreferencesHeartbeat();
    });

    expect(result.current.preferencesHeartbeat.status).toBe('stale');
    expect(result.current.preferencesHeartbeat.lastBeatAt).toBe('2026-06-24T12:00:00.000Z');
  });

  it('stops the preferences heartbeat interval on unmount', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));

    const { result, unmount } = renderHook(() =>
      useNotifications({
        userId: 'heartbeat-user',
        preferencesHeartbeatIntervalMs: 1000,
        preferencesHeartbeatStaleAfterMs: 3000,
      }),
    );

    await flushHookEffects();

    expect(result.current.preferencesHeartbeat.status).toBe('online');

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    const stored = JSON.parse(
      localStorageMock.getItem('notification_preferences_heartbeat_v1') ?? 'null',
    );
    expect(stored.lastBeatAt).toBe('2026-06-24T12:00:00.000Z');
  });

  it('reports the preferences heartbeat as offline when storage writes fail', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const { result } = renderHook(() =>
      useNotifications({
        userId: 'heartbeat-user',
        preferencesHeartbeatIntervalMs: 1000,
        preferencesHeartbeatStaleAfterMs: 3000,
      }),
    );

    await flushHookEffects();

    expect(result.current.preferencesHeartbeat.status).toBe('offline');
    expect(result.current.preferencesHeartbeat.storageAvailable).toBe(false);
    expect(result.current.preferencesHeartbeat.failureCount).toBe(1);
  });
});
