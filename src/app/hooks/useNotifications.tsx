'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotificationStore, AppNotification } from '@/app/store/notificationStore';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  UserNotificationPreferences,
  NotificationAnalytics,
  NotificationRecommendation,
  generateNotificationId,
  shouldSendNotification,
  calculateAnalytics,
  sortNotifications,
  filterNotifications,
  createDefaultPreferences,
  validatePreferences,
  NotificationService,
  generateRecommendations,
} from '@/lib/notifications';

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

  // Recommendations
  recommendations: NotificationRecommendation[];
  applyRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => void;
}

const PREFERENCES_STORAGE_KEY = 'notification_preferences_v1';
const DISMISSED_RECOMMENDATIONS_KEY = 'dismissed_recommendations_v1';

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { userId = 'default', enableAnalytics = true } = options;

  const {
    notifications,
    addNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    removeNotification: storeRemoveNotification,
    clearRead: storeClearRead,
  } = useNotificationStore();

  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_RECOMMENDATIONS_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Load preferences from localStorage
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
        } else {
          const defaultPrefs = NotificationService.createDefaultPreferences(userId);
          setPreferences(defaultPrefs);
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(defaultPrefs));
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        const defaultPrefs = NotificationService.createDefaultPreferences(userId);
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

      // Create notification using service
      const notification = NotificationService.createNotification({
        message,
        type,
        category,
        priority,
        channels,
        meta: {
          ...meta,
          userId,
        },
      });

      // Check if notification should be sent based on preferences
      if (preferences) {
        const shouldDeliver = NotificationService.shouldDeliver(notification, preferences);

        if (!shouldDeliver) {
          // Return a blocked notification for consistency
          return {
            ...notification,
            read: true,
            meta: { ...notification.meta, blocked: true },
          };
        }
      }

      // Add to store
      addNotification(notification);

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
      storeRemoveNotification(id);
    },
    [storeRemoveNotification],
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

      const validation = NotificationService.validatePreferences(prefs);
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

  // Send to specific channel
  const sendToChannel = useCallback(
    async (notification: AppNotification, channel: NotificationChannel): Promise<boolean> => {
      try {
        const results = await NotificationService.deliverToChannels(notification, [channel]);
        return results[0]?.success ?? false;
      } catch (error) {
        console.error(`Failed to deliver notification ${notification.id} via ${channel}:`, error);
        return false;
      }
    },
    [],
  );

  // Send to all channels
  const sendToAllChannels = useCallback(
    async (
      notification: AppNotification,
      channels: NotificationChannel[],
    ): Promise<Record<NotificationChannel, boolean>> => {
      try {
        const results = await NotificationService.deliverToChannels(notification, channels);
        const successMap: Record<NotificationChannel, boolean> = {} as Record<NotificationChannel, boolean>;
        
        results.forEach((result) => {
          successMap[result.channel] = result.success;
        });

        return successMap;
      } catch (error) {
        console.error('Failed to deliver notification to channels:', error);
        const errorMap: Record<NotificationChannel, boolean> = {} as Record<NotificationChannel, boolean>;
        channels.forEach((channel) => {
          errorMap[channel] = false;
        });
        return errorMap;
      }
    },
    [],
  );

  // Computed values
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Recommendations — recompute whenever analytics or preferences change
  const recommendations = useMemo<NotificationRecommendation[]>(() => {
    if (!analytics || !preferences) return [];
    const all = generateRecommendations(analytics, preferences);
    return all.filter((r) => !dismissedIds.has(r.id));
  }, [analytics, preferences, dismissedIds]);

  // Apply a recommendation: merge its patch into preferences then auto-dismiss
  const applyRecommendation = useCallback(
    async (id: string) => {
      const rec = recommendations.find((r) => r.id === id);
      if (!rec) return;
      await updatePreferences(rec.preferencePatch);
      // Dismiss after applying so it no longer appears
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        try {
          localStorage.setItem(DISMISSED_RECOMMENDATIONS_KEY, JSON.stringify([...next]));
        } catch { /* ignore */ }
        return next;
      });
    },
    [recommendations, updatePreferences],
  );

  // Dismiss without applying
  const dismissRecommendation = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(DISMISSED_RECOMMENDATIONS_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

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

    // Recommendations
    recommendations,
    applyRecommendation,
    dismissRecommendation,
  };
}

export default useNotifications;
