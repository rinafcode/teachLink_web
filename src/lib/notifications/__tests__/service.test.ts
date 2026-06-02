/**
 * NotificationService – unit tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from '../service';
import {
  AppNotification,
  NotificationChannel,
  NotificationCategory,
  UserNotificationPreferences,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockPreferences(
  overrides: Partial<UserNotificationPreferences> = {},
): UserNotificationPreferences {
  return {
    userId: 'test-user',
    channels: {
      push: true,
      email: true,
      sms: false,
      inApp: true,
    },
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
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
    frequency: {
      digest: 'realtime',
      maxPerDay: 50,
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  // ── createNotification ──────────────────────────────────────────────────────

  describe('createNotification', () => {
    it('creates a notification with required fields', () => {
      const notification = NotificationService.createNotification({
        message: 'Test message',
      });

      expect(notification.id).toBeTruthy();
      expect(notification.message).toBe('Test message');
      expect(notification.type).toBe('info');
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeTruthy();
      expect(notification.timestamp).toBeInstanceOf(Date);
    });

    it('creates a notification with custom type', () => {
      const notification = NotificationService.createNotification({
        message: 'Warning message',
        type: 'warning',
      });

      expect(notification.type).toBe('warning');
    });

    it('creates a notification with category and priority', () => {
      const notification = NotificationService.createNotification({
        message: 'Important update',
        category: 'course_update',
        priority: 'high',
      });

      expect(notification.category).toBe('course_update');
      expect(notification.priority).toBe('high');
      expect(notification.meta?.category).toBe('course_update');
      expect(notification.meta?.priority).toBe('high');
    });

    it('creates a notification with custom channels', () => {
      const notification = NotificationService.createNotification({
        message: 'Multi-channel message',
        channels: ['email', 'push'],
      });

      expect(notification.channels).toEqual(['email', 'push']);
      expect(notification.meta?.channels).toEqual(['email', 'push']);
    });

    it('creates a notification with custom metadata', () => {
      const notification = NotificationService.createNotification({
        message: 'Message with metadata',
        meta: { actionUrl: '/test', userId: '123' },
      });

      expect(notification.meta?.actionUrl).toBe('/test');
      expect(notification.meta?.userId).toBe('123');
    });

    it('generates unique IDs for each notification', () => {
      const notification1 = NotificationService.createNotification({ message: 'First' });
      const notification2 = NotificationService.createNotification({ message: 'Second' });

      expect(notification1.id).not.toBe(notification2.id);
    });
  });

  // ── shouldDeliver ───────────────────────────────────────────────────────────

  describe('shouldDeliver', () => {
    it('returns true when notification matches preferences', () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        category: 'system',
        channels: ['in-app'],
      };

      const preferences = createMockPreferences();

      expect(NotificationService.shouldDeliver(notification, preferences)).toBe(true);
    });

    it('returns false when category is disabled', () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        category: 'system',
        channels: ['in-app'],
      };

      const preferences = createMockPreferences({
        categories: {
          ...createMockPreferences().categories,
          system: { enabled: false, channels: ['in-app'] },
        },
      });

      expect(NotificationService.shouldDeliver(notification, preferences)).toBe(false);
    });

    it('returns false when channel is disabled', () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        category: 'system',
        channels: ['push'],
      };

      const preferences = createMockPreferences({
        categories: {
          ...createMockPreferences().categories,
          system: { enabled: true, channels: ['in-app'] }, // push not enabled
        },
      });

      expect(NotificationService.shouldDeliver(notification, preferences)).toBe(false);
    });

    it('returns true when at least one channel is enabled', () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        category: 'system',
        channels: ['in-app', 'push'],
      };

      const preferences = createMockPreferences({
        categories: {
          ...createMockPreferences().categories,
          system: { enabled: true, channels: ['in-app'] }, // push not enabled but in-app is
        },
      });

      expect(NotificationService.shouldDeliver(notification, preferences)).toBe(true);
    });
  });

  // ── deliverToChannels ────────────────────────────────────────────────────────

  describe('deliverToChannels', () => {
    it('delivers notification to a single channel successfully', async () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        channels: ['in-app'],
      };

      const results = await NotificationService.deliverToChannels(notification, ['in-app']);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].channel).toBe('in-app');
      expect(results[0].timestamp).toBeInstanceOf(Date);
    });

    it('delivers notification to multiple channels', async () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        channels: ['in-app', 'email'],
      };

      const results = await NotificationService.deliverToChannels(notification, [
        'in-app',
        'email',
      ]);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].channel).toBe('in-app');
      expect(results[1].channel).toBe('email');
    });

    it('returns failure result for failed delivery', async () => {
      const notification: AppNotification = {
        id: '1',
        type: 'info',
        message: 'Test',
        title: 'Test',
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
        read: false,
        channels: ['in-app'],
      };

      // Mock a failure by temporarily overriding the service method
      const originalSimulate = (NotificationService as any).simulateChannelDelivery;
      (NotificationService as any).simulateChannelDelivery = async () => {
        throw new Error('Delivery failed');
      };

      const results = await NotificationService.deliverToChannels(notification, ['in-app']);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeTruthy();

      // Restore original method
      (NotificationService as any).simulateChannelDelivery = originalSimulate;
    });
  });

  // ── validatePreferences ─────────────────────────────────────────────────────

  describe('validatePreferences', () => {
    it('validates correct preferences', () => {
      const preferences = createMockPreferences();
      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid channel boolean values', () => {
      const preferences = {
        channels: {
          push: 'true' as any,
          email: true,
          sms: false,
          inApp: true,
        },
      };

      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('channels.push must be a boolean');
    });

    it('detects invalid time format in quiet hours', () => {
      const preferences = {
        quietHours: {
          enabled: false,
          start: '25:00', // Invalid time
          end: '08:00',
          timezone: 'UTC',
        },
      };

      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('quietHours.start must be in HH:MM format');
    });

    it('detects invalid end time format in quiet hours', () => {
      const preferences = {
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '24:00', // Invalid time
          timezone: 'UTC',
        },
      };

      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('quietHours.end must be in HH:MM format');
    });

    it('accepts valid time format', () => {
      const preferences = {
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC',
        },
      };

      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(true);
    });

    it('validates partial preferences', () => {
      const preferences = {
        channels: {
          push: true,
          email: false,
        },
      };

      const result = NotificationService.validatePreferences(preferences);

      expect(result.valid).toBe(true);
    });
  });

  // ── createDefaultPreferences ───────────────────────────────────────────────

  describe('createDefaultPreferences', () => {
    it('creates default preferences for a user', () => {
      const preferences = NotificationService.createDefaultPreferences('user-123');

      expect(preferences.userId).toBe('user-123');
      expect(preferences.channels.push).toBe(true);
      expect(preferences.channels.email).toBe(true);
      expect(preferences.channels.sms).toBe(false);
      expect(preferences.channels.inApp).toBe(true);
    });

    it('enables all categories by default', () => {
      const preferences = NotificationService.createDefaultPreferences('user-123');

      Object.values(preferences.categories).forEach((category) => {
        expect(category.enabled).toBe(true);
      });
    });

    it('sets appropriate default channels for each category', () => {
      const preferences = NotificationService.createDefaultPreferences('user-123');

      expect(preferences.categories.system.channels).toEqual(['in-app']);
      expect(preferences.categories.payment.channels).toEqual(['in-app', 'email']);
      expect(preferences.categories.achievement.channels).toEqual(['in-app', 'push', 'email']);
    });

    it('sets default quiet hours configuration', () => {
      const preferences = NotificationService.createDefaultPreferences('user-123');

      expect(preferences.quietHours.enabled).toBe(false);
      expect(preferences.quietHours.start).toBe('22:00');
      expect(preferences.quietHours.end).toBe('08:00');
      expect(preferences.quietHours.timezone).toBe('UTC');
    });

    it('sets default frequency settings', () => {
      const preferences = NotificationService.createDefaultPreferences('user-123');

      expect(preferences.frequency.digest).toBe('realtime');
      expect(preferences.frequency.maxPerDay).toBe(50);
    });
  });
});
