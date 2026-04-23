'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';
import {
  NotificationCategory,
  NotificationPriority,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  truncateMessage,
  groupNotificationsByDate,
} from '@/utils/notificationUtils';

interface NotificationCenterProps {
  userId?: string;
  maxHeight?: string;
  showAnalytics?: boolean;
  showFilters?: boolean;
  onNotificationClick?: (notification: any) => void;
}

type FilterOption = 'all' | 'unread' | 'read';
type SortOption = 'newest' | 'oldest' | 'priority';

export default function NotificationCenter({
  userId,
  maxHeight = '500px',
  showAnalytics = true,
  showFilters = true,
  onNotificationClick,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    analytics,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllRead,
    getFilteredNotifications,
    getSortedNotifications,
  } = useNotifications({ userId, enableAnalytics: showAnalytics });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRead, setFilterRead] = useState<FilterOption>('all');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Filter and sort notifications
  const processedNotifications = useMemo(() => {
    let result = [...notifications];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((n) => n.message.toLowerCase().includes(query));
    }

    // Apply read filter
    if (filterRead !== 'all') {
      result = result.filter((n) => (filterRead === 'unread' ? !n.read : n.read));
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter((n) => n.meta?.category === filterCategory);
    }

    // Apply sorting
    const priorityOrder: Record<NotificationPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    result.sort((a, b) => {
      // Unread first
      if (a.read !== b.read) return a.read ? 1 : -1;

      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority':
          const aPriority = (a.meta?.priority as NotificationPriority) || 'medium';
          const bPriority = (b.meta?.priority as NotificationPriority) || 'medium';
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        default:
          return 0;
      }
    });

    return result;
  }, [notifications, searchQuery, filterRead, filterCategory, sortBy]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(processedNotifications);
  }, [processedNotifications]);

  // Toggle notification expansion
  const toggleExpand = (id: string) => {
    setExpandedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    toggleExpand(notification.id);
    onNotificationClick?.(notification);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterRead('all');
    setFilterCategory('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery || filterRead !== 'all' || filterCategory !== 'all' || sortBy !== 'newest';

  return (
    <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-600 text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showAnalytics && (
              <button
                onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                title="Analytics"
              >
                <BarChart3 size={18} />
              </button>
            )}
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-1.5 rounded hover:bg-gray-200 ${
                  hasActiveFilters ? 'text-blue-600' : 'text-gray-600'
                }`}
                title="Filters"
              >
                <Filter size={18} />
              </button>
            )}
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
              title="Mark all as read"
              disabled={unreadCount === 0}
            >
              <CheckCheck size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as FilterOption)}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | 'all')}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                <option value="all">All</option>
                <option value="course_update">Course Updates</option>
                <option value="message">Messages</option>
                <option value="achievement">Achievements</option>
                <option value="reminder">Reminders</option>
                <option value="system">System</option>
                <option value="social">Social</option>
                <option value="payment">Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full text-sm border rounded px-2 py-1.5"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalyticsPanel && analytics && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Analytics</span>
            <button
              onClick={() => setShowAnalyticsPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-semibold text-gray-900">{analytics.totalSent}</div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-semibold text-gray-900">{analytics.totalRead}</div>
              <div className="text-xs text-gray-500">Read</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {analytics.readRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Read Rate</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-lg font-semibold text-green-600">
                {analytics.clickRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Click Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {processedNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {hasActiveFilters ? 'No notifications match your filters' : "You're all caught up!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          Array.from(groupedNotifications.entries()).map(([date, dateNotifications]) => (
            <div key={date}>
              <div className="sticky top-0 px-4 py-2 bg-gray-100 text-xs font-medium text-gray-600 border-b">
                {date}
              </div>
              {dateNotifications.map((notification) => {
                const isExpanded = expandedNotifications.has(notification.id);
                const priority = (notification.meta?.priority as NotificationPriority) || 'medium';
                const category = (notification.meta?.category as NotificationCategory) || 'system';
                const icon = getNotificationIcon(category);
                const colorClass = getNotificationColor(priority);

                return (
                  <div
                    key={notification.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded ${colorClass}`}
                            >
                              {priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-900">
                            {isExpanded
                              ? notification.message
                              : truncateMessage(notification.message, 100)}
                          </p>
                          {notification.message.length > 100 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(notification.id);
                              }}
                              className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  Show less <ChevronUp size={12} />
                                </>
                              ) : (
                                <>
                                  Show more <ChevronDown size={12} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {processedNotifications.length} of {notifications.length} notifications
          </span>
          <button
            onClick={clearAllRead}
            className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
            disabled={notifications.filter((n) => n.read).length === 0}
          >
            Clear all read
          </button>
        </div>
      )}
    </div>
  );
}
