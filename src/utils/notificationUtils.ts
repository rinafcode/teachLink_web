/**
 * Notification Utilities
 * Provides helper functions for notification management, formatting, and analytics
 */

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

/**
 * Generate a unique notification ID
 */
export function generateNotificationId(): string {
  return `ntf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format notification timestamp for display
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(quietHours: { start: string; end: string; timezone: string }): boolean {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: quietHours.timezone,
  });

  const start = quietHours.start;
  const end = quietHours.end;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
}

/**
 * Determine if notification should be sent based on preferences
 */
export function shouldSendNotification(
  category: NotificationCategory,
  channel: NotificationChannel,
  preferences: UserNotificationPreferences
): boolean {
  // Check if channel is enabled globally
  if (!preferences.channels[channel === 'in-app' ? 'inApp' : channel]) {
    return false;
  }

  // Check if category is enabled
  const categoryPrefs = preferences.categories[category];
  if (!categoryPrefs?.enabled) {
    return false;
  }

  // Check if channel is enabled for this category
  if (!categoryPrefs.channels.includes(channel)) {
    return false;
  }

  // Check quiet hours
  if (preferences.quietHours.enabled && channel !== 'in-app') {
    if (isWithinQuietHours(preferences.quietHours)) {
      return false;
    }
  }

  // Check category-specific quiet hours
  if (categoryPrefs.quietHours) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    
    if (currentTime >= categoryPrefs.quietHours.start && 
        currentTime <= categoryPrefs.quietHours.end) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate notification analytics
 */
export function calculateAnalytics(
  notifications: Array<{
    read: boolean;
    clicked?: boolean;
    channel: NotificationChannel;
    category: NotificationCategory;
  }>
): NotificationAnalytics {
  const analytics: NotificationAnalytics = {
    totalSent: notifications.length,
    totalRead: 0,
    totalClicked: 0,
    readRate: 0,
    clickRate: 0,
    byChannel: {
      push: { sent: 0, read: 0, clicked: 0 },
      email: { sent: 0, read: 0, clicked: 0 },
      sms: { sent: 0, read: 0, clicked: 0 },
      'in-app': { sent: 0, read: 0, clicked: 0 },
    },
    byCategory: {
      course_update: { sent: 0, read: 0, clicked: 0 },
      message: { sent: 0, read: 0, clicked: 0 },
      achievement: { sent: 0, read: 0, clicked: 0 },
      reminder: { sent: 0, read: 0, clicked: 0 },
      system: { sent: 0, read: 0, clicked: 0 },
      social: { sent: 0, read: 0, clicked: 0 },
      payment: { sent: 0, read: 0, clicked: 0 },
    },
  };

  notifications.forEach((notification) => {
    if (notification.read) analytics.totalRead++;
    if (notification.clicked) analytics.totalClicked++;

    // Update channel stats
    analytics.byChannel[notification.channel].sent++;
    if (notification.read) analytics.byChannel[notification.channel].read++;
    if (notification.clicked) analytics.byChannel[notification.channel].clicked++;

    // Update category stats
    analytics.byCategory[notification.category].sent++;
    if (notification.read) analytics.byCategory[notification.category].read++;
    if (notification.clicked) analytics.byCategory[notification.category].clicked++;
  });

  analytics.readRate = analytics.totalSent > 0 
    ? (analytics.totalRead / analytics.totalSent) * 100 
    : 0;
  analytics.clickRate = analytics.totalSent > 0 
    ? (analytics.totalClicked / analytics.totalSent) * 100 
    : 0;

  return analytics;
}

/**
 * Sort notifications by priority and time
 */
export function sortNotifications<T extends { 
  priority: NotificationPriority; 
  createdAt: string;
  read: boolean;
}>(notifications: T[]): T[] {
  const priorityOrder: Record<NotificationPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...notifications].sort((a, b) => {
    // Unread first
    if (a.read !== b.read) return a.read ? 1 : -1;
    
    // Then by priority
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Then by time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter notifications by various criteria
 */
export function filterNotifications<T extends {
  type: string;
  category?: NotificationCategory;
  read: boolean;
  createdAt: string;
}>(
  notifications: T[],
  filters: {
    type?: string;
    category?: NotificationCategory;
    read?: boolean;
    dateRange?: { start: Date; end: Date };
  }
): T[] {
  return notifications.filter((notification) => {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.category && notification.category !== filters.category) return false;
    if (filters.read !== undefined && notification.read !== filters.read) return false;
    
    if (filters.dateRange) {
      const notifDate = new Date(notification.createdAt);
      if (notifDate < filters.dateRange.start || notifDate > filters.dateRange.end) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate<T extends { createdAt: string }>(
  notifications: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(notification);
  });
  
  return groups;
}

/**
 * Truncate notification message for preview
 */
export function truncateMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Get notification icon based on category
 */
export function getNotificationIcon(category: NotificationCategory): string {
  const icons: Record<NotificationCategory, string> = {
    course_update: '📚',
    message: '💬',
    achievement: '🏆',
    reminder: '⏰',
    system: '⚙️',
    social: '👥',
    payment: '💳',
  };
  return icons[category] || '🔔';
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    urgent: 'bg-red-100 border-red-300 text-red-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    medium: 'bg-blue-100 border-blue-300 text-blue-800',
    low: 'bg-gray-100 border-gray-300 text-gray-800',
  };
  return colors[priority];
}

/**
 * Validate notification preferences
 */
export function validatePreferences(preferences: Partial<UserNotificationPreferences>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (preferences.quietHours) {
    const { start, end } = preferences.quietHours;
    if (start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start)) {
      errors.push('Invalid quiet hours start time format (expected HH:MM)');
    }
    if (end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end)) {
      errors.push('Invalid quiet hours end time format (expected HH:MM)');
    }
  }

  if (preferences.frequency?.maxPerDay !== undefined) {
    if (preferences.frequency.maxPerDay < 0 || preferences.frequency.maxPerDay > 100) {
      errors.push('Max notifications per day must be between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default user preferences
 */
export function createDefaultPreferences(userId: string): UserNotificationPreferences {
  return {
    userId,
    channels: {
      push: true,
      email: true,
      sms: false,
      inApp: true,
    },
    categories: {
      course_update: { enabled: true, channels: ['push', 'email', 'in-app'] },
      message: { enabled: true, channels: ['push', 'in-app'] },
      achievement: { enabled: true, channels: ['push', 'in-app'] },
      reminder: { enabled: true, channels: ['push', 'email', 'in-app'] },
      system: { enabled: true, channels: ['email', 'in-app'] },
      social: { enabled: true, channels: ['push', 'in-app'] },
      payment: { enabled: true, channels: ['email', 'in-app'] },
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    frequency: {
      digest: 'realtime',
      maxPerDay: 20,
    },
  };
}
