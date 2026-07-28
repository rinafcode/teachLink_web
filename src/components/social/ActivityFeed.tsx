// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { UserCircle } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useSocialFeatures';
import { getRelativeTime, groupActivitiesByDate } from '@/utils/socialUtils';
import type { Activity } from '@/utils/socialUtils';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DATE_HEADER_HEIGHT = 32;
const ACTIVITY_ITEM_HEIGHT = 64;
const OVERSCAN_COUNT = 10;

// ─── Skeleton ──────────────────────────────────────────────────────────────────

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

// ─── Flattened item types ──────────────────────────────────────────────────────

type FlattenedItem =
  | { kind: 'dateHeader'; label: string }
  | { kind: 'activity'; activity: Activity };

/**
 * Flatten grouped activities into a list that interleaves date headers
 * with their corresponding activity items.
 */
function flattenGrouped(
  grouped: Record<string, Activity[]>,
): FlattenedItem[] {
  const result: FlattenedItem[] = [];
  for (const [label, items] of Object.entries(grouped)) {
    result.push({ kind: 'dateHeader', label });
    for (const activity of items) {
      result.push({ kind: 'activity', activity });
    }
  }
  return result;
}

// ─── Row renderer ──────────────────────────────────────────────────────────────

interface ActivityRowProps {
  item: FlattenedItem;
  style: React.CSSProperties;
}

const ActivityRow = ({ item, style }: ActivityRowProps) => {
  if (item.kind === 'dateHeader') {
    return (
      <div style={style}>
        <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50">
          {item.label}
        </p>
      </div>
    );
  }

  const activity = item.activity;
  return (
    <div style={style} className="flex gap-3 px-4 py-3">
      {activity.actorAvatar ? (
        <Image
          src={activity.actorAvatar}
          alt={activity.actorName}
          width={36}
          height={36}
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
            <>
              {' '}
              <span className="font-medium">{activity.targetTitle}</span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {getRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  userId: string;
  /** Optional fixed height for the list container. Defaults to filling the parent. */
  height?: number;
  /** Optional CSS class name. */
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ActivityFeed({ userId, height, className }: ActivityFeedProps) {
  const { activities, loadMore, loading, hasMore } = useActivityFeed(userId);
  const listRef = useRef<List>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Flatten grouped activities into a renderable list
  const grouped = useMemo(() => groupActivitiesByDate(activities), [activities]);
  const flattened = useMemo(() => flattenGrouped(grouped), [grouped]);

  // Track item sizes for VariableSizeList
  const getItemSize = useCallback(
    (index: number) => {
      const item = flattened[index];
      if (!item) return ACTIVITY_ITEM_HEIGHT;
      return item.kind === 'dateHeader' ? DATE_HEADER_HEIGHT : ACTIVITY_ITEM_HEIGHT;
    },
    [flattened],
  );

  // Reset list cache when flattened data changes (new items loaded)
  const flattenedKey = useMemo(
    () => flattened.map((f) => (f.kind === 'dateHeader' ? f.label : f.activity.id)).join(','),
    [flattened],
  );

  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [flattenedKey]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Row renderer for react-window
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <ActivityRow item={flattened[index]} style={style} />
    ),
    [flattened],
  );

  // ── Render ──

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className ?? ''}`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Activity</h3>
      </div>

      {/* Initial loading state */}
      {loading && activities.length === 0 && (
        <div className="px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && activities.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No activity yet.
        </p>
      )}

      {/* Virtualized list */}
      {activities.length > 0 && (
        <div style={height ? { height } : undefined}>
          <AutoSizer>
            {({ height: autoHeight, width }: { height: number; width: number }) => (
              <List
                ref={listRef}
                height={autoHeight}
                width={width}
                itemCount={flattened.length}
                itemSize={getItemSize}
                overscanCount={OVERSCAN_COUNT}
                estimatedItemSize={ACTIVITY_ITEM_HEIGHT}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {/* Loading more indicator */}
      {loading && activities.length > 0 && (
        <div className="px-4">
          <Skeleton />
        </div>
      )}

      {/* End of feed */}
      {!loading && !hasMore && activities.length > 0 && (
        <p className="py-4 text-center text-xs text-gray-400">No more activity</p>
      )}
    </div>
  );
}