'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, FileText, Settings, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

interface ScheduleEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: 'qa' | 'mentoring' | 'workshop';
  icon: any;
}

interface UpcomingDeadlinesWidgetProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  settings: Record<string, any>;
  onToggleCollapse: () => void;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  size: 'small' | 'medium' | 'large';
  onChangeSize: (size: 'small' | 'medium' | 'large') => void;
  onUpdateTitle: (title: string) => void;
}

export const UpcomingDeadlinesWidget: React.FC<UpcomingDeadlinesWidgetProps> = ({
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
      } catch (e) {
        if (!cancelled) setError('Failed to load schedule data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Mock schedule data matching Figma design
  const events: ScheduleEvent[] = [
    {
      id: '1',
      title: 'Live Q&A Session',
      subtitle: 'Intro to Starknet Course',
      date: new Date(new Date().setHours(14, 0, 0, 0)), // Today, 2:00 PM
      type: 'qa',
      icon: Clock
    },
    {
      id: '2',
      title: '1:1 Mentoring',
      subtitle: 'With John Smith',
      date: new Date(addDays(new Date(), 1).setHours(10, 0, 0, 0)), // Tomorrow, 10:00 AM
      type: 'mentoring',
      icon: Users
    },
    {
      id: '3',
      title: 'Workshop',
      subtitle: 'Smart Contract Security',
      date: new Date(addDays(new Date(), 3).setHours(15, 30, 0, 0)), // Fri, 15, 3:30 PM
      type: 'workshop',
      icon: FileText
    }
  ];

  const formatScheduleDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    }
    return format(date, 'EEE, d, h:mm a');
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{events.length} events</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Clock size={20} />
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
            <Clock size={20} className="text-purple-600 dark:text-purple-400" />
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
              <Clock size={16} />
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
                onChange={(e) => onChangeSize(e.target.value as any)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Show Completed</label>
              <select
                value={settings.showCompleted ? 'yes' : 'no'}
                onChange={(e) => onUpdateSettings({ showCompleted: e.target.value === 'yes' })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
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
          Your upcoming classes and events.
        </p>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Icon size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-1">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatScheduleDate(event.date)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
