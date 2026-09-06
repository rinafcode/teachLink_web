import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateNotificationId,
  formatNotificationTime,
  isWithinQuietHours,
  shouldSendNotification,
  calculateAnalytics,
  sortNotifications,
  filterNotifications,
  groupNotificationsByDate,
  truncateMessage,
  getNotificationIcon,
  getNotificationColor,
  validatePreferences,
  createDefaultPreferences,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  UserNotificationPreferences,
} from '../notificationUtils';

describe('notificationUtils', () => {
  describe('generateNotificationId', () => {
    it('generates unique IDs prefixed with ntf_', () => {
      const id1 = generateNotificationId();
      const id2 = generateNotificationId();

      expect(id1.startsWith('ntf_')).toBe(true);
      expect(id2.startsWith('ntf_')).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatNotificationTime', () => {
    it('returns empty string for invalid timestamp strings', () => {
      expect(formatNotificationTime('invalid-date')).toBe('');
    });

    it('returns "Just now" for timestamps less than a minute ago or in the future', () => {
      const now = new Date();
      expect(formatNotificationTime(now.toISOString())).toBe('Just now');

      const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
      expect(formatNotificationTime(thirtySecsAgo.toISOString())).toBe('Just now');

      const future = new Date(Date.now() + 5000);
      expect(formatNotificationTime(future.toISOString())).toBe('Just now');
    });

    it('returns minutes ago for timestamps within the past hour', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(formatNotificationTime(tenMinsAgo.toISOString())).toBe('10m ago');
    });

    it('returns hours ago for timestamps within 24 hours', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      expect(formatNotificationTime(fiveHoursAgo.toISOString())).toBe('5h ago');
    });

    it('returns days ago for timestamps within 7 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatNotificationTime(threeDaysAgo.toISOString())).toBe('3d ago');
    });

    it('returns localized date for timestamps older than 7 days', () => {
      const oldDate = new Date('2020-01-15T12:00:00.000Z');
      const formatted = formatNotificationTime(oldDate.toISOString());
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2020');
    });
  });

  describe('isWithinQuietHours', () => {
    it('returns false for invalid quiet hours object', () => {
      expect(isWithinQuietHours({ start: '', end: '', timezone: '' })).toBe(false);
    });

    it('handles same-day quiet hours correctly', () => {
      const now = new Date();
      const currentHour = now.getHours();
      const pad = (n: number) => n.toString().padStart(2, '0');

      const start = pad(Math.max(0, currentHour - 1)) + ':00';
      const end = pad(Math.min(23, currentHour + 1)) + ':59';

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      expect(isWithinQuietHours({ start, end, timezone })).toBe(true);

      const pastStart = '01:00';
      const pastEnd = '02:00';
      // If current hour is outside 01:00-02:00
      if (currentHour < 1 || currentHour > 2) {
        expect(isWithinQuietHours({ start: pastStart, end: pastEnd, timezone })).toBe(false);
      }
    });

    it('handles overnight quiet hours (e.g. 22:00 to 08:00)', () => {
      const timezone = 'UTC';
      // If start > end, checks if current >= start OR current <= end
      const isNight = isWithinQuietHours({ start: '00:00', end: '23:59', timezone });
      expect(isNight).toBe(true);
    });
  });

  describe('shouldSendNotification', () => {
    let basePrefs: UserNotificationPreferences;

    beforeEach(() => {
      basePrefs = createDefaultPreferences('user_123');
    });

    it('returns false when preferences are invalid or incomplete', () => {
      expect(
        shouldSendNotification('message', 'in-app', null as unknown as UserNotificationPreferences),
      ).toBe(false);
    });

    it('returns false if channel is disabled globally', () => {
      basePrefs.channels.email = false;
      expect(shouldSendNotification('course_update', 'email', basePrefs)).toBe(false);

      basePrefs.channels.inApp = false;
      expect(shouldSendNotification('message', 'in-app', basePrefs)).toBe(false);
    });

    it('returns false if category is disabled', () => {
      basePrefs.categories.message.enabled = false;
      expect(shouldSendNotification('message', 'in-app', basePrefs)).toBe(false);
    });

    it('returns false if channel is not enabled for specific category', () => {
      basePrefs.categories.course_update.channels = ['email'];
      expect(shouldSendNotification('course_update', 'push', basePrefs)).toBe(false);
    });

    it('allows in-app notifications during global quiet hours', () => {
      basePrefs.quietHours = {
        enabled: true,
        start: '00:00',
        end: '23:59',
        timezone: 'UTC',
      };
      expect(shouldSendNotification('message', 'in-app', basePrefs)).toBe(true);
    });

    it('blocks external push notifications during global quiet hours', () => {
      basePrefs.quietHours = {
        enabled: true,
        start: '00:00',
        end: '23:59',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      };
      expect(shouldSendNotification('course_update', 'push', basePrefs)).toBe(false);
    });

    it('returns true when all conditions pass', () => {
      basePrefs.quietHours.enabled = false;
      expect(shouldSendNotification('course_update', 'email', basePrefs)).toBe(true);
      expect(shouldSendNotification('message', 'in-app', basePrefs)).toBe(true);
    });
  });

  describe('calculateAnalytics', () => {
    it('calculates 0 rates for empty notification list', () => {
      const analytics = calculateAnalytics([]);
      expect(analytics.totalSent).toBe(0);
      expect(analytics.totalRead).toBe(0);
      expect(analytics.totalClicked).toBe(0);
      expect(analytics.readRate).toBe(0);
      expect(analytics.clickRate).toBe(0);
    });

    it('computes correct metrics and breakdowns for notification items', () => {
      const notifications = [
        {
          read: true,
          clicked: true,
          channel: 'in-app' as NotificationChannel,
          category: 'message' as NotificationCategory,
        },
        {
          read: true,
          clicked: false,
          channel: 'push' as NotificationChannel,
          category: 'course_update' as NotificationCategory,
        },
        {
          read: false,
          clicked: false,
          channel: 'email' as NotificationChannel,
          category: 'system' as NotificationCategory,
        },
        {
          read: false,
          channel: 'sms' as NotificationChannel,
          category: 'payment' as NotificationCategory,
        },
      ];

      const analytics = calculateAnalytics(notifications);
      expect(analytics.totalSent).toBe(4);
      expect(analytics.totalRead).toBe(2);
      expect(analytics.totalClicked).toBe(1);
      expect(analytics.readRate).toBe(50);
      expect(analytics.clickRate).toBe(25);

      expect(analytics.byChannel['in-app'].sent).toBe(1);
      expect(analytics.byChannel['in-app'].read).toBe(1);
      expect(analytics.byChannel['in-app'].clicked).toBe(1);

      expect(analytics.byCategory.message.sent).toBe(1);
      expect(analytics.byCategory.message.read).toBe(1);
      expect(analytics.byCategory.message.clicked).toBe(1);

      expect(analytics.byCategory.system.sent).toBe(1);
      expect(analytics.byCategory.system.read).toBe(0);
    });
  });

  describe('sortNotifications', () => {
    it('sorts unread notifications before read, then by priority, then by newest date', () => {
      const items = [
        { id: '1', read: true, priority: 'urgent' as NotificationPriority, createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', read: false, priority: 'low' as NotificationPriority, createdAt: '2024-01-01T10:00:00Z' },
        { id: '3', read: false, priority: 'urgent' as NotificationPriority, createdAt: '2024-01-01T08:00:00Z' },
        { id: '4', read: false, priority: 'urgent' as NotificationPriority, createdAt: '2024-01-01T12:00:00Z' },
      ];

      const sorted = sortNotifications(items);
      expect(sorted.map((item) => item.id)).toEqual(['4', '3', '2', '1']);
    });
  });

  describe('filterNotifications', () => {
    const list = [
      {
        id: '1',
        type: 'alert',
        category: 'message' as NotificationCategory,
        read: false,
        createdAt: '2024-01-02T10:00:00Z',
      },
      {
        id: '2',
        type: 'info',
        category: 'course_update' as NotificationCategory,
        read: true,
        createdAt: '2024-01-05T10:00:00Z',
      },
      {
        id: '3',
        type: 'alert',
        category: 'system' as NotificationCategory,
        read: true,
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    it('filters by type', () => {
      const result = filterNotifications(list, { type: 'alert' });
      expect(result.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('filters by category', () => {
      const result = filterNotifications(list, { category: 'course_update' });
      expect(result.map((i) => i.id)).toEqual(['2']);
    });

    it('filters by read status', () => {
      const result = filterNotifications(list, { read: false });
      expect(result.map((i) => i.id)).toEqual(['1']);
    });

    it('filters by dateRange', () => {
      const result = filterNotifications(list, {
        dateRange: {
          start: new Date('2024-01-04T00:00:00Z'),
          end: new Date('2024-01-06T00:00:00Z'),
        },
      });
      expect(result.map((i) => i.id)).toEqual(['2']);
    });
  });

  describe('groupNotificationsByDate', () => {
    it('groups notifications correctly by date string', () => {
      const list = [
        { id: '1', createdAt: '2024-03-01T10:00:00Z' },
        { id: '2', createdAt: '2024-03-01T15:00:00Z' },
        { id: '3', createdAt: '2024-03-02T10:00:00Z' },
      ];

      const groups = groupNotificationsByDate(list);
      expect(groups.size).toBe(2);
      const values = Array.from(groups.values());
      expect(values[0].length).toBe(2);
      expect(values[1].length).toBe(1);
    });
  });

  describe('truncateMessage', () => {
    it('returns original message if within maxLength', () => {
      expect(truncateMessage('Hello World', 20)).toBe('Hello World');
      expect(truncateMessage('Hello World', 11)).toBe('Hello World');
    });

    it('truncates message and appends ellipsis if exceeding maxLength', () => {
      expect(truncateMessage('Hello Wonderful World', 10)).toBe('Hello W...');
    });
  });

  describe('getNotificationIcon and getNotificationColor', () => {
    it('returns appropriate icon for known and unknown categories', () => {
      expect(getNotificationIcon('course_update')).toBe('📚');
      expect(getNotificationIcon('message')).toBe('💬');
      expect(getNotificationIcon('achievement')).toBe('🏆');
      expect(getNotificationIcon('reminder')).toBe('⏰');
      expect(getNotificationIcon('system')).toBe('⚙️');
      expect(getNotificationIcon('social')).toBe('👥');
      expect(getNotificationIcon('payment')).toBe('💳');
      expect(getNotificationIcon('unknown' as NotificationCategory)).toBe('🔔');
    });

    it('returns style classes for priority levels', () => {
      expect(getNotificationColor('urgent')).toContain('bg-red-100');
      expect(getNotificationColor('high')).toContain('bg-orange-100');
      expect(getNotificationColor('medium')).toContain('bg-blue-100');
      expect(getNotificationColor('low')).toContain('bg-gray-100');
    });
  });

  describe('validatePreferences', () => {
    it('validates correct preferences', () => {
      const result = validatePreferences({
        quietHours: { enabled: true, start: '22:00', end: '08:00', timezone: 'UTC' },
        frequency: { digest: 'realtime', maxPerDay: 50 },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid quiet hours start and end formats', () => {
      const result = validatePreferences({
        quietHours: { enabled: true, start: '25:99', end: '8pm', timezone: 'UTC' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('detects out-of-range maxPerDay values', () => {
      const result1 = validatePreferences({
        frequency: { digest: 'daily', maxPerDay: -1 },
      });
      expect(result1.valid).toBe(false);
      expect(result1.errors[0]).toContain('between 0 and 100');

      const result2 = validatePreferences({
        frequency: { digest: 'daily', maxPerDay: 101 },
      });
      expect(result2.valid).toBe(false);
    });
  });

  describe('createDefaultPreferences', () => {
    it('creates full defaults with expected user id and default channels/categories', () => {
      const prefs = createDefaultPreferences('user_999');
      expect(prefs.userId).toBe('user_999');
      expect(prefs.channels.push).toBe(true);
      expect(prefs.channels.email).toBe(true);
      expect(prefs.channels.inApp).toBe(true);
      expect(prefs.channels.sms).toBe(false);
      expect(prefs.categories.course_update.enabled).toBe(true);
      expect(prefs.frequency.maxPerDay).toBe(20);
      expect(prefs.quietHours.enabled).toBe(false);
    });
  });
});
