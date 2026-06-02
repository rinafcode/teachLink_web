/**
 * useNotifications – unit tests
 *
 * Focuses on the refactored clearNotification (delegates to store action)
 * and basic hook behaviour.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useNotifications', () => {
  beforeEach(resetStore);

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
});
