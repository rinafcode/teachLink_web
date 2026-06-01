/**
 * Notification Service
 * Business logic layer for notification operations
 */

import {
  AppNotification,
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  UserNotificationPreferences,
  NotificationDeliveryResult,
  generateNotificationId,
  shouldSendNotification,
  isWithinQuietHours,
} from './index';

export class NotificationService {
  /**
   * Create a new notification with proper validation
   */
  static createNotification(params: {
    message: string;
    type?: AppNotification['type'];
    category?: NotificationCategory;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    meta?: Record<string, any>;
  }): AppNotification {
    const {
      message,
      type = 'info',
      category = 'system',
      priority = 'medium',
      channels = ['in-app'],
      meta = {},
    } = params;

    return {
      id: generateNotificationId(),
      type,
      message,
      title: meta.title || message,
      createdAt: new Date().toISOString(),
      timestamp: new Date(),
      read: false,
      meta: {
        ...meta,
        category,
        priority,
        channels,
      },
      category,
      priority,
      channels,
    };
  }

  /**
   * Check if notification should be delivered based on user preferences
   */
  static shouldDeliver(
    notification: AppNotification,
    preferences: UserNotificationPreferences,
  ): boolean {
    const category = notification.category || 'system';
    const channels = notification.channels || ['in-app'];

    return channels.some((channel) =>
      shouldSendNotification(category, channel, preferences),
    );
  }

  /**
   * Deliver notification to specified channels
   */
  static async deliverToChannels(
    notification: AppNotification,
    channels: NotificationChannel[],
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    for (const channel of channels) {
      try {
        // Simulate channel delivery
        await this.simulateChannelDelivery(notification, channel);
        results.push({
          success: true,
          channel,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          success: false,
          channel,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Validate notification preferences
   */
  static validatePreferences(
    prefs: Partial<UserNotificationPreferences>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (prefs.channels) {
      if (typeof prefs.channels.push !== 'boolean') {
        errors.push('channels.push must be a boolean');
      }
      if (typeof prefs.channels.email !== 'boolean') {
        errors.push('channels.email must be a boolean');
      }
      if (typeof prefs.channels.sms !== 'boolean') {
        errors.push('channels.sms must be a boolean');
      }
      if (typeof prefs.channels.inApp !== 'boolean') {
        errors.push('channels.inApp must be a boolean');
      }
    }

    if (prefs.quietHours) {
      if (prefs.quietHours.start && !this.isValidTimeFormat(prefs.quietHours.start)) {
        errors.push('quietHours.start must be in HH:MM format');
      }
      if (prefs.quietHours.end && !this.isValidTimeFormat(prefs.quietHours.end)) {
        errors.push('quietHours.end must be in HH:MM format');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create default preferences for a user
   */
  static createDefaultPreferences(userId: string): UserNotificationPreferences {
    return {
      userId,
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
    };
  }

  private static async simulateChannelDelivery(
    notification: AppNotification,
    channel: NotificationChannel,
  ): Promise<void> {
    // Simulate async delivery
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private static isValidTimeFormat(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }
}
