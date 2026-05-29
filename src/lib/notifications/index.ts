/**
 * Notification System Library
 * Unified entry point for all notification-related functionality
 */

export * from './types';
export * from './service';

// Re-export utility functions from notificationUtils
export {
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
  createDefaultPreferences,
  validatePreferences,
} from '@/utils/notificationUtils';
