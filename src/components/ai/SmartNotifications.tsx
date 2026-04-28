'use client';

/**
 * SmartNotifications – study reminders with dismiss support
 *
 * API (placeholder – implement backend to match):
 *   GET  /api/ai/reminders          → ApiResponse<Reminder[]>
 *   DELETE /api/ai/reminders/:id    → ApiResponse<null>
 */

import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotification } from '@/hooks/use-notification';
import type { ApiResponse } from '@/types/api';

interface Reminder {
  id: string;
  title: string;
  scheduledAt: string;
}

export default function SmartNotifications() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ApiResponse<Reminder[]>>('/api/ai/reminders')
      .then((res) => {
        if (!cancelled) setReminders(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load reminders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = async (id: string) => {
    try {
      await apiClient.delete<ApiResponse<null>>(`/api/ai/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      success('Reminder dismissed.');
    } catch {
      notifyError('Failed to dismiss reminder.');
    }
  };

  return (
    <section
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5"
      aria-label="Smart Notifications"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
        <h2 className="font-semibold text-[#0F172A] dark:text-white">Study Reminders</h2>
      </div>

      {loading && (
        <ul className="space-y-3" aria-label="Loading reminders">
          {[1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-4 w-full" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && reminders.length === 0 && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No upcoming reminders.</p>
      )}

      {!loading && !error && reminders.length > 0 && (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#F1F5F9] dark:bg-[#0F172A] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">{r.title}</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {new Date(r.scheduledAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => dismiss(r.id)}
                aria-label={`Dismiss reminder: ${r.title}`}
                className="flex-shrink-0 p-1 rounded-md text-[#64748B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
