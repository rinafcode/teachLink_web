'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

// GET /api/ai/progress → ApiResponse<ProgressData>

interface ProgressData {
  streak: number;
  totalTimeSpent: number;
  dailyGoal: number;
  lastActive: string;
  completedCourses: number;
  totalCourses: number;
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export default function IntelligentProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get<ProgressData>('/api/ai/progress')
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const completion =
    data && data.totalCourses > 0
      ? Math.round((data.completedCourses / data.totalCourses) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Your Progress</h2>
      </div>

      <div className="p-4 space-y-4">
        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-center text-red-500 py-4">Failed to load progress.</p>}

        {data && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>{data.streak}-day streak</span>
                <span>{completion}% complete</span>
              </div>
              <ProgressBar percent={completion} />
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Total courses</span>
                <span>
                  {data.completedCourses}/{data.totalCourses}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Daily goal</span>
                <span>{data.dailyGoal} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Last active</span>
                <span>{new Date(data.lastActive).toLocaleDateString()}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
