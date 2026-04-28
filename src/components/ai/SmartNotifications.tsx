'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/hooks/use-notification';

// GET /api/ai/reminders → { reminders: Reminder[] }
// DELETE /api/ai/reminders/:id

interface Reminder {
  id: string;
  title: string;
  scheduledAt: string; // ISO string
}

export default function SmartNotifications() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useNotification();

  useEffect(() => {
    apiClient
      .get<{ reminders: Reminder[] }>('/api/ai/reminders')
      .then((r) => setReminders(r.reminders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dismiss = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/api/ai/reminders/${id}`);
        setReminders((prev) => prev.filter((r) => r.id !== id));
        success('Reminder dismissed');
      } catch {
        error('Failed to dismiss reminder');
      }
    },
    [success, error],
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Bell className="w-5 h-5 text-orange-500" />
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Study Reminders</h2>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading && (
          <div className="animate-pulse p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            ))}
          </div>
        )}

        {!loading && reminders.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-6">No upcoming reminders.</p>
        )}

        {reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {reminder.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(reminder.scheduledAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => dismiss(reminder.id)}
              aria-label={`Dismiss ${reminder.title}`}
              className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
