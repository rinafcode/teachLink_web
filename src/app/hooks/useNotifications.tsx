'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotificationStore, AppNotification } from '@/app/store/notificationStore';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  UserNotificationPreferences,
  NotificationAnalytics,
  generateNotificationId,
  shouldSendNotification,
  calculateAnalytics,
  sortNotifications,
  filterNotifications,
  createDefaultPreferences,
  validatePreferences,
} from '@/utils/notificationUtils';

interface UseNotificationsOptions {
  userId?: string;
  enableAnalytics?: boolean;
}

interface UseNotificationsReturn {
  // State
  notifications: AppNotification[];
  unreadCount: number;
  preferences: UserNotificationPreferences | null;
  analytics: NotificationAnalytics | null;
  isLoading: boolean;

  // Actions
  sendNotification: (params: {
    message: string;
    type?: AppNotification['type'];
    category?: NotificationCategory;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    meta?: Record<string, any>;
  }) => AppNotification;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllRead: () => void;

  // Preferences
  loadPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserNotificationPreferences>) => Promise<void>;

  // Filtering & Sorting
  getFilteredNotifications: (filters: {
    type?: string;
    category?: NotificationCategory;
    read?: boolean;
  }) => AppNotification[];

  getSortedNotifications: () => AppNotification[];

  // Analytics
  refreshAnalytics: () => void;

  // Multi-channel delivery
  sendToChannel: (notification: AppNotification, channel: NotificationChannel) => Promise<boolean>;

  sendToAllChannels: (
    notification: AppNotification,
    channels: NotificationChannel[],
  ) => Promise<Record<NotificationChannel, boolean>>;
}

const PREFERENCES_STORAGE_KEY = 'notification_preferences_v1';

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { userId = 'default', enableAnalytics = true } = options;

  const {
    notifications,
    addNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    clearRead: storeClearRead,
  } = useNotificationStore();

  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
        } else {
          const defaultPrefs = createDefaultPreferences(userId);
          setPreferences(defaultPrefs);
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(defaultPrefs));
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        const defaultPrefs = createDefaultPreferences(userId);
        setPreferences(defaultPrefs);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [userId]);

  // Calculate analytics when notifications change
  useEffect(() => {
    if (enableAnalytics && notifications.length > 0) {
      const analyticsData = calculateAnalytics(
        notifications.map((n) => ({
          read: n.read,
          clicked: n.meta?.clicked ?? false,
          channel: (n.meta?.channel as NotificationChannel) || 'in-app',
          category: (n.meta?.category as NotificationCategory) || 'system',
        })),
      );
      setAnalytics(analyticsData);
    }
  }, [notifications, enableAnalytics]);

  // Send notification with preference checking
  const sendNotification = useCallback(
    (params: {
      message: string;
      type?: AppNotification['type'];
      category?: NotificationCategory;
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      meta?: Record<string, any>;
    }) => {
      const {
        message,
        type = 'info',
        category = 'system',
        priority = 'medium',
        channels = ['in-app'],
        meta = {},
      } = params;

      // Check if notification should be sent based on preferences
      if (preferences) {
        const shouldSend = channels.some((channel) =>
          shouldSendNotification(category, channel, preferences),
        );

        if (!shouldSend) {
          console.log(`Notification blocked by preferences: ${category}`);
          // Return a dummy notification for consistency
          return {
            id: generateNotificationId(),
            type,
            message,
            createdAt: new Date().toISOString(),
            read: true,
            meta: { ...meta, category, priority, channels, blocked: true },
          };
        }
      }

      // Create the notification
      const notification = addNotification({
        type,
        message,
        meta: {
          ...meta,
          category,
          priority,
          channels,
          userId,
        },
      });

      return notification;
    },
    [addNotification, preferences, userId],
  );

  // Mark as read
  const markAsRead = useCallback(
    (id: string) => {
      storeMarkAsRead(id);
    },
    [storeMarkAsRead],
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    storeMarkAllAsRead();
  }, [storeMarkAllAsRead]);

  // Clear single notification
  const clearNotification = useCallback(
    (id: string) => {
      const next = notifications.filter((n) => n.id !== id);
      useNotificationStore.setState({ notifications: next });
      localStorage.setItem('notifications_v1', JSON.stringify(next));
    },
    [notifications],
  );

  // Clear all read notifications
  const clearAllRead = useCallback(() => {
    storeClearRead();
  }, [storeClearRead]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<UserNotificationPreferences>) => {
      if (!preferences) return;

      const validation = validatePreferences(prefs);
      if (!validation.valid) {
        throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`);
      }

      const updated = { ...preferences, ...prefs };
      setPreferences(updated);

      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save preferences:', error);
        throw error;
      }
    },
    [preferences],
  );

  // Get filtered notifications
  const getFilteredNotifications = useCallback(
    (filters: { type?: string; category?: NotificationCategory; read?: boolean }) => {
      return filterNotifications(notifications, filters);
    },
    [notifications],
  );

  // Get sorted notifications
  const getSortedNotifications = useCallback(() => {
    return sortNotifications(
      notifications.map((n) => ({
        ...n,
        priority: (n.meta?.priority as NotificationPriority) || 'medium',
      })),
    );
  }, [notifications]);

  // Refresh analytics
  const refreshAnalytics = useCallback(() => {
    if (notifications.length > 0) {
      const analyticsData = calculateAnalytics(
        notifications.map((n) => ({
          read: n.read,
          clicked: n.meta?.clicked ?? false,
          channel: (n.meta?.channel as NotificationChannel) || 'in-app',
          category: (n.meta?.category as NotificationCategory) || 'system',
        })),
      );
      setAnalytics(analyticsData);
    }
  }, [notifications]);

  // Send to specific channel (simulated)
  const sendToChannel = useCallback(
    async (notification: AppNotification, channel: NotificationChannel): Promise<boolean> => {
      // Simulate channel delivery with different success rates
      const deliveryRates: Record<NotificationChannel, number> = {
        'in-app': 1.0,
        push: 0.95,
        email: 0.98,
        sms: 0.92,
      };

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));

      // Simulate delivery success/failure
      const success = Math.random() < deliveryRates[channel];

      if (success) {
        console.log(`Notification ${notification.id} delivered via ${channel}`);
      } else {
        console.warn(`Failed to deliver notification ${notification.id} via ${channel}`);
      }

      return success;
    },
    [],
  );

  // Send to all channels
  const sendToAllChannels = useCallback(
    async (
      notification: AppNotification,
      channels: NotificationChannel[],
    ): Promise<Record<NotificationChannel, boolean>> => {
      const results: Record<string, boolean> = {};

      await Promise.all(
        channels.map(async (channel) => {
          results[channel] = await sendToChannel(notification, channel);
        }),
      );

      return results as Record<NotificationChannel, boolean>;
    },
    [sendToChannel],
  );

  // Computed values
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    analytics,
    isLoading,

    // Actions
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllRead,

    // Preferences
    loadPreferences,
    updatePreferences,

    // Filtering & Sorting
    getFilteredNotifications,
    getSortedNotifications,

    // Analytics
    refreshAnalytics,

    // Multi-channel delivery
    sendToChannel,
    sendToAllChannels,
  };
}

export default useNotifications;
