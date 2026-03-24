'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Settings, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'message' | 'featured' | 'reputation' | 'review';
  title: string;
  description: string;
  timestamp: Date;
  color: string;
  dotColor: string;
}

interface RecentActivityWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, unknown>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onRemove: () => void;
  size: 'small' | 'medium' | 'large';
  onChangeSize: (size: 'small' | 'medium' | 'large') => void;
  onUpdateTitle: (title: string) => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  id,
  title,
  isCollapsed,
  settings,
  onToggleCollapse,
  onUpdateSettings,
  onRemove,
  size,
  onChangeSize,
  onUpdateTitle
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
      } catch {
        if (!cancelled) setError('Failed to load activity data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Mock activity data matching Figma design
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'enrollment',
      title: "New student enrolled in 'Intro to Starknet'",
      description: '',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      color: 'text-green-600 dark:text-green-400',
      dotColor: 'bg-green-500'
    },
    {
      id: '2',
      type: 'message',
      title: 'You received a new message',
      description: '',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      color: 'text-blue-600 dark:text-blue-400',
      dotColor: 'bg-blue-500'
    },
    {
      id: '3',
      type: 'featured',
      title: "Your course 'Web3 Basics' was featured",
      description: '',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      color: 'text-yellow-600 dark:text-yellow-400',
      dotColor: 'bg-yellow-500'
    },
    {
      id: '4',
      type: 'reputation',
      title: 'You earned 25 reputation points',
      description: '',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      color: 'text-purple-600 dark:text-purple-400',
      dotColor: 'bg-purple-500'
    },
    {
      id: '5',
      type: 'review',
      title: "New review on 'Advanced Cairo'",
      description: '',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      color: 'text-red-600 dark:text-red-400',
      dotColor: 'bg-red-500'
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return format(date, 'MMM d, yyyy');
  };

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{activities.length} activities</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Activity size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={20} className="text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsConfigOpen((v) => !v)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Widget settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Collapse widget"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
              aria-label="Remove widget"
            >
              ×
            </button>
          </div>
        </div>
        {isConfigOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  const trimmed = tempTitle.trim();
                  if (trimmed) onUpdateTitle(trimmed);
                  else setTempTitle(title);
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                placeholder="Widget title"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => onChangeSize(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Refresh</label>
              <select
                // @ts-expect-error - settings is of type unknown
                value={settings.refreshInterval ?? 'manual'}
                onChange={(e) => onUpdateSettings({ refreshInterval: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
              >
                <option value="30s">30 seconds</option>
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        {/* Subtitle */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your recent platform activity.
        </p>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              {/* Colored Dot */}
              <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${activity.dotColor}`} />

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-50">
                  {activity.title}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
