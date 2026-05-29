/**
 * Unified Notification Types
 * Centralized type definitions for the notification system
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'message' | 'course' | 'system';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory =
  | 'course_update'
  | 'message'
  | 'achievement'
  | 'reminder'
  | 'system'
  | 'social'
  | 'payment';

export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AppNotification extends BaseNotification {
  message: string;
  createdAt: string;
  meta?: Record<string, any>;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  variables: string[];
}

export interface NotificationAnalytics {
  totalSent: number;
  totalRead: number;
  totalClicked: number;
  readRate: number;
  clickRate: number;
  byChannel: Record<NotificationChannel, { sent: number; read: number; clicked: number }>;
  byCategory: Record<NotificationCategory, { sent: number; read: number; clicked: number }>;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean;
      channels: NotificationChannel[];
      quietHours?: { start: string; end: string };
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: {
    digest: 'realtime' | 'hourly' | 'daily' | 'weekly';
    maxPerDay: number;
  };
}

export interface NotificationEvent {
  event: 'notification' | 'notification_read' | 'notification_clear';
  payload: unknown;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
  timestamp: Date;
}
