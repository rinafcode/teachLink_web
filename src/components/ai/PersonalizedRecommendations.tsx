'use client';

/**
 * PersonalizedRecommendations – AI-driven course/resource suggestions
 *
 * API (placeholder – implement backend to match):
 *   GET /api/ai/recommendations
 *   → ApiResponse<Recommendation[]>
 */

import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ApiResponse } from '@/types/api';

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  url: string;
}

export default function PersonalizedRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ApiResponse<Recommendation[]>>('/api/ai/recommendations')
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load recommendations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5"
      aria-label="Personalized Recommendations"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
        <h2 className="font-semibold text-[#0F172A] dark:text-white">Recommended for You</h2>
      </div>

      {loading && (
        <ul className="space-y-4" aria-label="Loading recommendations">
          {[1, 2, 3].map((i) => (
            <li key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No recommendations yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1">
              <a
                href={item.url}
                className="font-medium text-[#0066FF] dark:text-[#00C2FF] hover:underline flex items-center gap-1 text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
                <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              </a>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{item.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
