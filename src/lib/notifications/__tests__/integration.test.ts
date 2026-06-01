/**
 * Notification System – integration tests
 * Tests the interaction between different components of the notification system
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useNotificationStore } from '@/app/store/notificationStore';
import { NotificationService } from '../service';
import { AppNotification } from '../types';

// ─── Mock localStorage ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// @ts-ignore
global.localStorage = localStorageMock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  localStorageMock.clear();
  useNotificationStore.setState({ notifications: [] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Notification System Integration', () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  // ── End-to-End Notification Flow ────────────────────────────────────────────

  describe('End-to-End Notification Flow', () => {
    it('creates notification through hook and stores it in Zustand store', async () => {
      const { result } = renderHook(() => useNotifications());

      let notification: AppNotification;
      await act(async () => {
        notification = result.current.sendNotification({
          message: 'Integration test notification',
          type: 'success',
          category: 'achievement',
          priority: 'high',
        });
      });

      // Check notification was created with correct properties
      expect(notification).toBeDefined();
      expect(notification.message).toBe('Integration test notification');
      expect(notification.type).toBe('success');
      expect(notification.category).toBe('achievement');
      expect(notification.priority).toBe('high');

      // Check it's in the hook's state
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe(notification.id);

      // Check it's in the Zustand store
      const storeState = useNotificationStore.getState();
      expect(storeState.notifications).toHaveLength(1);
      expect(storeState.notifications[0].id).toBe(notification.id);
    });

    it('respects user preferences when sending notifications', async () => {
      const { result } = renderHook(() => useNotifications({ userId: 'test-user' }));

      // Wait for preferences to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update preferences to disable system notifications
      await act(async () => {
        await result.current.updatePreferences({
          categories: {
            ...result.current.preferences!.categories,
            system: { enabled: false, channels: ['in-app'] },
          },
        });
      });

      // Try to send a system notification
      let blockedNotification: AppNotification;
      await act(async () => {
        blockedNotification = result.current.sendNotification({
          message: 'System notification',
          category: 'system',
        });
      });

      // Notification should be blocked
      expect(blockedNotification.meta?.blocked).toBe(true);
      expect(blockedNotification.read).toBe(true);

      // Should not appear in notifications
      expect(result.current.notifications).toHaveLength(0);
    });

    it('allows notifications when preferences match', async () => {
      const { result } = renderHook(() => useNotifications({ userId: 'test-user' }));

      // Wait for preferences to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Send an achievement notification (enabled by default)
      await act(async () => {
        result.current.sendNotification({
          message: 'Achievement unlocked!',
          category: 'achievement',
          priority: 'high',
        });
      });

      // Notification should appear
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].meta?.blocked).toBeUndefined();
    });

    it('delivers notifications to multiple channels', async () => {
      const { result } = renderHook(() => useNotifications());

      let notification: AppNotification;
      await act(async () => {
        notification = result.current.sendNotification({
          message: 'Multi-channel test',
          channels: ['in-app', 'email'],
        });
      });

      // Deliver to channels
      let deliveryResults: Record<string, boolean>;
      await act(async () => {
        deliveryResults = await result.current.sendToAllChannels(
          notification,
          notification.channels || ['in-app'],
        );
      });

      expect(deliveryResults).toBeDefined();
      expect(deliveryResults['in-app']).toBe(true);
      expect(deliveryResults['email']).toBe(true);
    });
  });

  // ── Store and Hook Integration ───────────────────────────────────────────────

  describe('Store and Hook Integration', () => {
    it('synchronizes read status between hook and store', async () => {
      const { result } = renderHook(() => useNotifications());

      let notificationId: string;
      await act(async () => {
        const notification = result.current.sendNotification({ message: 'Test' });
        notificationId = notification.id;
      });

      // Mark as read through hook
      await act(async () => {
        result.current.markAsRead(notificationId);
      });

      // Check hook state
      expect(result.current.notifications[0].read).toBe(true);

      // Check store state
      const storeState = useNotificationStore.getState();
      expect(storeState.notifications[0].read).toBe(true);
    });

    it('synchronizes clear operations between hook and store', async () => {
      const { result } = renderHook(() => useNotifications());

      let notificationId: string;
      await act(async () => {
        const notification = result.current.sendNotification({ message: 'Test' });
        notificationId = notification.id;
      });

      // Clear through hook
      await act(async () => {
        result.current.clearNotification(notificationId);
      });

      // Check both hook and store are empty
      expect(result.current.notifications).toHaveLength(0);
      const storeState = useNotificationStore.getState();
      expect(storeState.notifications).toHaveLength(0);
    });
  });

  // ── Service Layer Integration ────────────────────────────────────────────────

  describe('Service Layer Integration', () => {
    it('uses NotificationService for notification creation', async () => {
      const { result } = renderHook(() => useNotifications());

      let notification: AppNotification;
      await act(async () => {
        notification = result.current.sendNotification({
          message: 'Service test',
          type: 'warning',
        });
      });

      // Verify notification structure matches service output
      expect(notification.id).toBeTruthy();
      expect(notification.timestamp).toBeInstanceOf(Date);
      expect(notification.createdAt).toBeTruthy();
      expect(notification.read).toBe(false);
    });

    it('uses NotificationService for preference validation', async () => {
      const { result } = renderHook(() => useNotifications({ userId: 'test-user' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to update with invalid preferences
      await expect(
        act(async () => {
          await result.current.updatePreferences({
            channels: {
              push: 'true' as any, // Invalid type
              email: true,
              sms: false,
              inApp: true,
            },
          });
        }),
      ).rejects.toThrow();
    });

    it('uses NotificationService for delivery operations', async () => {
      const { result } = renderHook(() => useNotifications());

      let notification: AppNotification;
      await act(async () => {
        notification = result.current.sendNotification({
          message: 'Delivery test',
          channels: ['email'],
        });
      });

      // Direct service call
      const serviceResults = await NotificationService.deliverToChannels(notification, ['email']);

      expect(serviceResults).toHaveLength(1);
      expect(serviceResults[0].success).toBe(true);
    });
  });

  // ── Persistence Integration ─────────────────────────────────────────────────

  describe('Persistence Integration', () => {
    it('persists notifications to localStorage', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        result.current.sendNotification({ message: 'Persistence test' });
      });

      // Check localStorage
      const stored = JSON.parse(localStorageMock.getItem('notifications_v1') ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].message).toBe('Persistence test');
    });

    it('persists preferences to localStorage', async () => {
      const { result } = renderHook(() => useNotifications({ userId: 'test-user' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePreferences({
          frequency: { digest: 'daily', maxPerDay: 25 },
        });
      });

      // Check localStorage
      const stored = JSON.parse(localStorageMock.getItem('notification_preferences_v1') ?? 'null');
      expect(stored).toBeDefined();
      expect(stored.frequency.digest).toBe('daily');
      expect(stored.frequency.maxPerDay).toBe(25);
    });

    it('loads preferences from localStorage on hook initialization', async () => {
      // Set up preferences in localStorage
      const mockPreferences = {
        userId: 'test-user',
        channels: { push: true, email: true, sms: false, inApp: true },
        categories: {
          course_update: { enabled: true, channels: ['in-app', 'email'] },
          message: { enabled: true, channels: ['in-app', 'push'] },
          achievement: { enabled: true, channels: ['in-app', 'push', 'email'] },
          reminder: { enabled: true, channels: ['in-app', 'push'] },
          system: { enabled: true, channels: ['in-app'] },
          social: { enabled: true, channels: ['in-app'] },
          payment: { enabled: true, channels: ['in-app', 'email'] },
        },
        quietHours: {
          enabled: true,
          start: '23:00',
          end: '07:00',
          timezone: 'America/New_York',
        },
        frequency: { digest: 'daily', maxPerDay: 30 },
      };

      localStorageMock.setItem('notification_preferences_v1', JSON.stringify(mockPreferences));

      // Render hook
      const { result } = renderHook(() => useNotifications({ userId: 'test-user' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences).toBeDefined();
      expect(result.current.preferences?.quietHours.enabled).toBe(true);
      expect(result.current.preferences?.quietHours.start).toBe('23:00');
      expect(result.current.preferences?.frequency.digest).toBe('daily');
    });
  });

  // ── Analytics Integration ───────────────────────────────────────────────────

  describe('Analytics Integration', () => {
    it('calculates analytics based on notification states', async () => {
      const { result } = renderHook(() => useNotifications({ enableAnalytics: true }));

      // Add multiple notifications
      await act(async () => {
        result.current.sendNotification({ message: 'First', category: 'system' });
        result.current.sendNotification({ message: 'Second', category: 'message' });
        result.current.sendNotification({ message: 'Third', category: 'achievement' });
      });

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      expect(result.current.analytics?.totalSent).toBe(3);
      expect(result.current.analytics?.totalRead).toBe(0);
    });

    it('updates analytics when notifications are marked as read', async () => {
      const { result } = renderHook(() => useNotifications({ enableAnalytics: true }));

      let notificationId: string;
      await act(async () => {
        const notification = result.current.sendNotification({ message: 'Test' });
        notificationId = notification.id;
      });

      await act(async () => {
        result.current.markAsRead(notificationId);
      });

      await waitFor(() => {
        expect(result.current.analytics).toBeDefined();
      });

      expect(result.current.analytics?.totalRead).toBe(1);
    });
  });
});
