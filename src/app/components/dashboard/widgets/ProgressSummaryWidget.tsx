'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, BarChart3, BookOpen, TrendingUp, Settings } from 'lucide-react';

interface ProgressSummaryWidgetProps {
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

type StatType = 'revenue' | 'students' | 'views' | 'courses';

const getStatData = (statType: StatType) => {
  switch (statType) {
    case 'revenue':
      return {
        label: 'Total Revenue',
        value: '$1,245.89',
        change: '+12.5%',
        changeLabel: 'from last month',
        icon: DollarSign,
        iconColor: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        changeColor: 'text-green-600 dark:text-green-400'
      };
    case 'students':
      return {
        label: 'Students',
        value: '245',
        change: '+18%',
        changeLabel: 'from last month',
        icon: Users,
        iconColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        changeColor: 'text-green-600 dark:text-green-400'
      };
    case 'views':
      return {
        label: 'Course Views',
        value: '1,892',
        change: '+9.3%',
        changeLabel: 'from last month',
        icon: BarChart3,
        iconColor: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        changeColor: 'text-green-600 dark:text-green-400'
      };
    case 'courses':
      return {
        label: 'Active Courses',
        value: '3',
        change: '+1',
        changeLabel: 'from last month',
        icon: BookOpen,
        iconColor: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        changeColor: 'text-green-600 dark:text-green-400'
      };
    default:
      return {
        label: 'Total Revenue',
        value: '$1,245.89',
        change: '+12.5%',
        changeLabel: 'from last month',
        icon: DollarSign,
        iconColor: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        changeColor: 'text-green-600 dark:text-green-400'
      };
  }
};

export const ProgressSummaryWidget: React.FC<ProgressSummaryWidgetProps> = ({
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

  // Determine stat type from title or settings
  const statType: StatType = (settings.statType as StatType) || 
    (title.toLowerCase().includes('revenue') ? 'revenue' :
     title.toLowerCase().includes('student') ? 'students' :
     title.toLowerCase().includes('view') ? 'views' :
     title.toLowerCase().includes('course') ? 'courses' : 'revenue');

  const statData = getStatData(statType);
  const Icon = statData.icon;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((res) => setTimeout(res, 150));
        if (cancelled) return;
      } catch (e: any) {
        if (!cancelled) setError('Failed to load progress data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (isCollapsed) {
    return (
      <motion.div
        layout
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  // For small size, show compact stat card matching Figma
  if (size === 'small') {
    return (
      <motion.div
        layout
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
        
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${statData.bgColor}`}>
            <Icon size={24} className={statData.iconColor} />
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsConfigOpen((v) => !v)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Widget settings"
            >
              <Settings size={14} />
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
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
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
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Stat Type</label>
              <select
                value={statType}
                onChange={(e) => onUpdateSettings({ statType: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50"
              >
                <option value="revenue">Revenue</option>
                <option value="students">Students</option>
                <option value="views">Course Views</option>
                <option value="courses">Active Courses</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{statData.label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{statData.value}</p>
          <div className="flex items-center space-x-1">
            <TrendingUp size={14} className={statData.changeColor} />
            <span className={`text-sm font-medium ${statData.changeColor}`}>
              {statData.change}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {statData.changeLabel}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // For medium/large sizes, show expanded view
  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon size={20} className={statData.iconColor} />
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
              <Icon size={16} />
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
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Stat Type</label>
              <select
                value={statType}
                onChange={(e) => onUpdateSettings({ statType: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
              >
                <option value="revenue">Revenue</option>
                <option value="students">Students</option>
                <option value="views">Course Views</option>
                <option value="courses">Active Courses</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        <div className="flex items-start justify-between mb-4">
          <div className={`p-4 rounded-lg ${statData.bgColor}`}>
            <Icon size={32} className={statData.iconColor} />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{statData.label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-3">{statData.value}</p>
          <div className="flex items-center space-x-1">
            <TrendingUp size={16} className={statData.changeColor} />
            <span className={`text-base font-medium ${statData.changeColor}`}>
              {statData.change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {statData.changeLabel}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
