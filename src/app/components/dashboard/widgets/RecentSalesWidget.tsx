'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface Sale {
  id: string;
  userEmail: string;
  userName: string;
  date: Date;
  amount: number;
}

interface RecentSalesWidgetProps {
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

export const RecentSalesWidget: React.FC<RecentSalesWidgetProps> = ({
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
        if (!cancelled) setError('Failed to load sales data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Mock sales data
  const sales: Sale[] = [
    {
      id: '1',
      userEmail: 'user1@example.com',
      userName: 'User 1',
      date: new Date(2025, 4, 28),
      amount: 49.99
    },
    {
      id: '2',
      userEmail: 'user2@example.com',
      userName: 'User 2',
      date: new Date(2025, 4, 27),
      amount: 79.99
    },
    {
      id: '3',
      userEmail: 'user3@example.com',
      userName: 'User 3',
      date: new Date(2025, 4, 26),
      amount: 29.99
    },
    {
      id: '4',
      userEmail: 'user4@example.com',
      userName: 'User 4',
      date: new Date(2025, 4, 25),
      amount: 99.99
    },
    {
      id: '5',
      userEmail: 'user5@example.com',
      userName: 'User 5',
      date: new Date(2025, 4, 24),
      amount: 59.99
    }
  ];

  const totalSales = sales.length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{totalSales} sales</span>
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <DollarSign size={20} />
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
            <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
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
              <DollarSign size={16} />
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
          You made {totalSales} sales this month.
        </p>

        {/* Sales List */}
        <div className="space-y-3">
          {sales.map((sale, index) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {getInitials(sale.userName)}
                </span>
              </div>

              {/* Sale Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                  {sale.userEmail}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(sale.date, 'M/d/yyyy')}
                </p>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +${sale.amount.toFixed(2)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
