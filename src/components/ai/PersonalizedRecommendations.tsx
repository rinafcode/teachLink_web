'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';

// GET /api/ai/recommendations → { items: Recommendation[] }

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  url: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}

export default function PersonalizedRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ items: Recommendation[] }>('/api/ai/recommendations')
      .then((r) => setItems(r.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
          Recommended for You
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {error && (
          <p className="text-sm text-center text-red-500 py-4">
            Failed to load recommendations.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-4">No recommendations yet.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.reason}</p>
            <a
              href={item.url}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              View course <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
