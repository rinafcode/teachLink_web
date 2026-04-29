'use client';

/**
 * IntelligentProgress – visualises user progress with AI-generated insights
 *
 * API: GET /api/user/progress → ApiResponse<UserProgress>
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ApiResponse, UserProgress } from '@/types/api';

function buildInsights(p: UserProgress): string[] {
  const insights: string[] = [];
  const pct = p.totalCourses > 0 ? Math.round((p.completedCourses / p.totalCourses) * 100) : 0;
  insights.push(`You're ${pct}% through your enrolled courses.`);
  if (p.streak >= 7) insights.push(`🔥 ${p.streak}-day streak – keep it up!`);
  if (p.totalTimeSpent > 0) {
    const hours = Math.floor(p.totalTimeSpent / 60);
    insights.push(`Total time spent: ${hours}h ${p.totalTimeSpent % 60}m`);
  }
  const remaining = p.dailyGoal - (p.totalTimeSpent % p.dailyGoal || 0);
  if (remaining > 0 && remaining < p.dailyGoal) {
    insights.push(`${remaining} min left to hit today's daily goal.`);
  }
  return insights;
}

export default function IntelligentProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ApiResponse<UserProgress>>('/api/user/progress')
      .then((res) => {
        if (!cancelled) setProgress(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load progress data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pct =
    progress && progress.totalCourses > 0
      ? Math.round((progress.completedCourses / progress.totalCourses) * 100)
      : 0;

  return (
    <section
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5"
      aria-label="Intelligent Progress"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
        <h2 className="font-semibold text-[#0F172A] dark:text-white">Your Progress</h2>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && progress && (
        <>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B] dark:text-[#94A3B8]">
                {progress.completedCourses} / {progress.totalCourses} courses
              </span>
              <span className="font-bold text-[#0066FF] dark:text-[#00C2FF]">{pct}%</span>
            </div>
            <div
              className="w-full h-3 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course completion"
            >
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] to-[#00C2FF] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Insights */}
          <ul className="space-y-1">
            {buildInsights(progress).map((insight, i) => (
              <li key={i} className="text-sm text-[#64748B] dark:text-[#94A3B8] flex gap-2">
                <span aria-hidden="true">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
