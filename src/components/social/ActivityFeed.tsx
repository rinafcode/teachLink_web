'use client';

import { useEffect, useRef } from 'react';
import { UserCircle } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useSocialFeatures';
import { getRelativeTime, groupActivitiesByDate } from '@/utils/socialUtils';

function Skeleton() {
  return (
    <div className="flex gap-3 animate-pulse py-3">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  userId: string;
}

export default function ActivityFeed({ userId }: ActivityFeedProps) {
  const { activities, loadMore, loading, hasMore } = useActivityFeed(userId);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Trigger loadMore when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const grouped = groupActivitiesByDate(activities);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Activity</h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading && activities.length === 0 && (
          <div className="px-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        )}

        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50">
              {date}
            </p>
            {items.map((activity) => (
              <div key={activity.id} className="flex gap-3 px-4 py-3">
                {activity.actorAvatar ? (
                  <img
                    src={activity.actorAvatar}
                    alt={activity.actorName}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <UserCircle className="w-9 h-9 text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.actorName}</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
                    {activity.targetTitle && (
                      <> <span className="font-medium">{activity.targetTitle}</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {getRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {loading && activities.length > 0 && (
          <div className="px-4">
            <Skeleton />
          </div>
        )}

        {!loading && !hasMore && activities.length > 0 && (
          <p className="py-4 text-center text-xs text-gray-400">No more activity</p>
        )}

        {!loading && activities.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
        )}
      </div>
    </div>
  );
}
