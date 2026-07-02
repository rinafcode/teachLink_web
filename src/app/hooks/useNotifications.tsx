// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { createLogger } from '@/lib/logging';

const logger = createLogger('use-notifications');

interface UseNotificationsOptions {
  userId?: string;
  enableAnalytics?: boolean;
  enablePreferencesHeartbeat?: boolean;
  preferencesHeartbeatIntervalMs?: number;
  preferencesHeartbeatStaleAfterMs?: number;
}

export type PreferencesHeartbeatStatus = 'online' | 'stale' | 'offline';

export interface PreferencesHeartbeatState {
  status: PreferencesHeartbeatStatus;
  userId: string;
  lastBeatAt: string | null;
  nextBeatAt: string | null;
  intervalMs: number;
  staleAfterMs: number;
  failureCount: number;
  storageAvailable: boolean;
}

interface UseNotificationsReturn {
  // State
  notifications: AppNotification[];
  unreadCount: number;
  preferences: UserNotificationPreferences | null;
  preferencesHeartbeat: PreferencesHeartbeatState;
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
  refreshPreferencesHeartbeat: () => PreferencesHeartbeatState;

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
const PREFERENCES_HEARTBEAT_KEY = 'notification_preferences_heartbeat_v1';
const DISMISSED_RECOMMENDATIONS_KEY = 'dismissed_recommendations_v1';
const DEFAULT_PREFERENCES_HEARTBEAT_INTERVAL_MS = 30000;
const DEFAULT_PREFERENCES_HEARTBEAT_STALE_AFTER_MS = 90000;

function createPreferencesHeartbeatState(params: {
  userId: string;
  intervalMs: number;
  staleAfterMs: number;
  status?: PreferencesHeartbeatStatus;
  lastBeatAt?: string | null;
  nextBeatAt?: string | null;
  failureCount?: number;
  storageAvailable?: boolean;
}): PreferencesHeartbeatState {
  return {
    status: params.status ?? 'offline',
    userId: params.userId,
    lastBeatAt: params.lastBeatAt ?? null,
    nextBeatAt: params.nextBeatAt ?? null,
    intervalMs: params.intervalMs,
    staleAfterMs: params.staleAfterMs,
    failureCount: params.failureCount ?? 0,
    storageAvailable: params.storageAvailable ?? true,
  };
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    userId = 'default',
    enableAnalytics = true,
    enablePreferencesHeartbeat = true,
    preferencesHeartbeatIntervalMs = DEFAULT_PREFERENCES_HEARTBEAT_INTERVAL_MS,
    preferencesHeartbeatStaleAfterMs = DEFAULT_PREFERENCES_HEARTBEAT_STALE_AFTER_MS,
  } = options;

  const {
    notifications,
    addNotification,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    removeNotification: storeRemoveNotification,
    clearRead: storeClearRead,
  } = useNotificationStore();

  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [preferencesHeartbeat, setPreferencesHeartbeat] = useState<PreferencesHeartbeatState>(() =>
    createPreferencesHeartbeatState({
      userId,
      intervalMs: preferencesHeartbeatIntervalMs,
      staleAfterMs: preferencesHeartbeatStaleAfterMs,
    }),
  );
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

  const refreshPreferencesHeartbeat = useCallback((): PreferencesHeartbeatState => {
    try {
      const stored = localStorage.getItem(PREFERENCES_HEARTBEAT_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      const lastBeatAt =
        parsed?.userId === userId && typeof parsed?.lastBeatAt === 'string'
          ? parsed.lastBeatAt
          : null;
      const ageMs = lastBeatAt ? Date.now() - new Date(lastBeatAt).getTime() : Infinity;
      const status: PreferencesHeartbeatStatus =
        lastBeatAt && ageMs <= preferencesHeartbeatStaleAfterMs ? 'online' : 'stale';
      const nextBeatAt =
        lastBeatAt && status === 'online'
          ? new Date(new Date(lastBeatAt).getTime() + preferencesHeartbeatIntervalMs).toISOString()
          : null;
      const nextState = createPreferencesHeartbeatState({
        userId,
        intervalMs: preferencesHeartbeatIntervalMs,
        staleAfterMs: preferencesHeartbeatStaleAfterMs,
        status,
        lastBeatAt,
        nextBeatAt,
        failureCount: parsed?.failureCount ?? 0,
        storageAvailable: true,
      });

      setPreferencesHeartbeat(nextState);
      return nextState;
    } catch {
      const offlineState = createPreferencesHeartbeatState({
        userId,
        intervalMs: preferencesHeartbeatIntervalMs,
        staleAfterMs: preferencesHeartbeatStaleAfterMs,
        status: 'offline',
        storageAvailable: false,
        failureCount: preferencesHeartbeat.failureCount + 1,
      });
      setPreferencesHeartbeat(offlineState);
      return offlineState;
    }
  }, [
    preferencesHeartbeat.failureCount,
    preferencesHeartbeatIntervalMs,
    preferencesHeartbeatStaleAfterMs,
    userId,
  ]);

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
        logger.error('Failed to load notification preferences', { error });
        const defaultPrefs = NotificationService.createDefaultPreferences(userId);
        setPreferences(defaultPrefs);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, [userId]);

  useEffect(() => {
    if (!enablePreferencesHeartbeat || isLoading || !preferences) {
      return undefined;
    }

    const beat = () => {
      const now = Date.now();
      const lastBeatAt = new Date(now).toISOString();
      const nextBeatAt = new Date(now + preferencesHeartbeatIntervalMs).toISOString();

      setPreferencesHeartbeat((previous) => {
        const nextState = createPreferencesHeartbeatState({
          userId,
          intervalMs: preferencesHeartbeatIntervalMs,
          staleAfterMs: preferencesHeartbeatStaleAfterMs,
          status: 'online',
          lastBeatAt,
          nextBeatAt,
          failureCount: previous.failureCount,
          storageAvailable: true,
        });

        try {
          localStorage.setItem(
            PREFERENCES_HEARTBEAT_KEY,
            JSON.stringify({
              userId,
              lastBeatAt,
              intervalMs: preferencesHeartbeatIntervalMs,
              staleAfterMs: preferencesHeartbeatStaleAfterMs,
              failureCount: previous.failureCount,
            }),
          );
          return nextState;
        } catch {
          return {
            ...nextState,
            status: 'offline',
            nextBeatAt: null,
            failureCount: previous.failureCount + 1,
            storageAvailable: false,
          };
        }
      });
    };

    beat();
    const intervalId = window.setInterval(beat, preferencesHeartbeatIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    enablePreferencesHeartbeat,
    isLoading,
    preferences,
    preferencesHeartbeatIntervalMs,
    preferencesHeartbeatStaleAfterMs,
    userId,
  ]);

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
      logger.error('Failed to load preferences', { error });
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
        logger.error('Failed to save preferences', { error });
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
        logger.error(`Failed to deliver notification ${notification.id} via ${channel}`, { error });
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
        const successMap: Record<NotificationChannel, boolean> = {} as Record<
          NotificationChannel,
          boolean
        >;

        results.forEach((result) => {
          successMap[result.channel] = result.success;
        });

        return successMap;
      } catch (error) {
        logger.error('Failed to deliver notification to channels', { error });
        const errorMap: Record<NotificationChannel, boolean> = {} as Record<
          NotificationChannel,
          boolean
        >;
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
        } catch {
          /* ignore */
        }
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
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    preferencesHeartbeat,
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
    refreshPreferencesHeartbeat,

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
