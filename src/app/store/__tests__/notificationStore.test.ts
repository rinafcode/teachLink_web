/**
 * notificationStore – unit tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';
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

describe('notificationStore', () => {
  beforeEach(resetStore);

  // ── addNotification ────────────────────────────────────────────────────────

  it('adds a notification and returns it', () => {
    const { addNotification, notifications } = useNotificationStore.getState();
    const n = addNotification({ type: 'info', message: 'hello' });

    expect(n.id).toBeTruthy();
    expect(n.type).toBe('info');
    expect(n.message).toBe('hello');
    expect(n.read).toBe(false);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  it('prepends new notifications (newest first)', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', message: 'first' });
    addNotification({ type: 'info', message: 'second' });

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].message).toBe('second');
    expect(notifications[1].message).toBe('first');
  });

  it('persists to localStorage on add', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({ type: 'success', message: 'saved' });

    const stored = JSON.parse(localStorageMock.getItem('notifications_v1') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].message).toBe('saved');
  });

  it('rehydrates saved notifications from localStorage', async () => {
    const saved = [
      {
        id: 'stored-1',
        type: 'info',
        title: 'Saved',
        message: 'hydrated',
        createdAt: '2024-01-02T03:04:05.000Z',
        timestamp: '2024-01-02T03:04:05.000Z',
        read: false,
        meta: { source: 'storage' },
      },
    ];

    localStorageMock.setItem('notifications_v1', JSON.stringify(saved));
    useNotificationStore.setState({ notifications: [] });

    await useNotificationStore.persist.rehydrate();

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].message).toBe('hydrated');
    expect(useNotificationStore.getState().notifications[0].timestamp).toBeInstanceOf(Date);
  });

  // ── markAsRead ─────────────────────────────────────────────────────────────

  it('marks a single notification as read', () => {
    const { addNotification, markAsRead } = useNotificationStore.getState();
    const n = addNotification({ type: 'info', message: 'test' });

    markAsRead(n.id);

    const updated = useNotificationStore.getState().notifications.find((x) => x.id === n.id);
    expect(updated?.read).toBe(true);
  });

  it('does not affect other notifications when marking one as read', () => {
    const { addNotification, markAsRead } = useNotificationStore.getState();
    const a = addNotification({ type: 'info', message: 'a' });
    const b = addNotification({ type: 'info', message: 'b' });

    markAsRead(a.id);

    const { notifications } = useNotificationStore.getState();
    expect(notifications.find((x) => x.id === a.id)?.read).toBe(true);
    expect(notifications.find((x) => x.id === b.id)?.read).toBe(false);
  });

  // ── markAllAsRead ──────────────────────────────────────────────────────────

  it('marks all notifications as read', () => {
    const { addNotification, markAllAsRead } = useNotificationStore.getState();
    addNotification({ type: 'info', message: 'a' });
    addNotification({ type: 'warning', message: 'b' });

    markAllAsRead();

    const { notifications } = useNotificationStore.getState();
    expect(notifications.every((n) => n.read)).toBe(true);
  });

  // ── removeNotification ─────────────────────────────────────────────────────

  it('removes the notification with the given id', () => {
    const { addNotification, removeNotification } = useNotificationStore.getState();
    const a = addNotification({ type: 'info', message: 'keep' });
    const b = addNotification({ type: 'error', message: 'remove me' });

    removeNotification(b.id);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe(a.id);
  });

  it('persists to localStorage after removal', () => {
    const { addNotification, removeNotification } = useNotificationStore.getState();
    const n = addNotification({ type: 'info', message: 'bye' });

    removeNotification(n.id);

    const stored = JSON.parse(localStorageMock.getItem('notifications_v1') ?? '[]');
    expect(stored.state.notifications).toHaveLength(0);
  });

  it('rehydrates persisted notifications from localStorage', () => {
    const timestamp = new Date('2024-01-01T00:00:00.000Z').toISOString();
    const stored = {
      state: {
        notifications: [
          {
            id: 'stored-1',
            type: 'info',
            title: 'Stored',
            message: 'Loaded from storage',
            body: 'Body',
            timestamp,
            read: false,
            createdAt: timestamp,
            meta: {},
          },
        ],
      },
      version: 0,
    };

    localStorageMock.setItem('notifications_v1', JSON.stringify(stored));
    useNotificationStore.setState({ notifications: [] });

    useNotificationStore.persist.rehydrate();

    const restored = useNotificationStore.getState().notifications;
    expect(restored).toHaveLength(1);
    expect(restored[0].timestamp).toBeInstanceOf(Date);
    expect(restored[0].message).toBe('Loaded from storage');
  });

  it('is a no-op when id does not exist', () => {
    const { addNotification, removeNotification } = useNotificationStore.getState();
    addNotification({ type: 'info', message: 'stay' });

    removeNotification('nonexistent-id');

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });

  // ── clearRead ──────────────────────────────────────────────────────────────

  it('removes only read notifications', () => {
    const { addNotification, markAsRead, clearRead } = useNotificationStore.getState();
    const a = addNotification({ type: 'info', message: 'unread' });
    const b = addNotification({ type: 'info', message: 'read' });

    markAsRead(b.id);
    clearRead();

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe(a.id);
  });
});
