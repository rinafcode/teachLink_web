'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { UserCircle, Heart, MessageCircle, TrendingUp, Clock, ArrowUp } from 'lucide-react';
import { useTopicFeed, type SortOption } from '@/hooks/useTopicFeed';
import { getRelativeTime, formatFollowerCount } from '@/utils/socialUtils';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="p-4 animate-pulse" aria-hidden="true">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

// ─── Sort controls ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'latest', label: 'Latest', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'popular', label: 'Popular', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: 'oldest', label: 'Oldest', icon: <ArrowUp className="w-3.5 h-3.5" /> },
];

interface SortBarProps {
  current: SortOption;
  onChange: (s: SortOption) => void;
}

function SortBar({ current, onChange }: SortBarProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg" role="group" aria-label="Sort posts">
      {SORT_OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={current === value}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            current === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── TopicFeed ─────────────────────────────────────────────────────────────────

interface TopicFeedProps {
  slug: string;
}

export default function TopicFeed({ slug }: TopicFeedProps) {
  const { topic, posts, loading, loadingMore, hasMore, sort, setSort, loadMore, error } =
    useTopicFeed(slug);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-4">
      {/* Topic header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        {loading && !topic ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ) : topic ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">#{topic.name}</h1>
            {topic.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
            )}
            <div className="mt-3 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>
                <strong className="text-gray-900 dark:text-white">
                  {formatFollowerCount(topic.postCount)}
                </strong>{' '}
                posts
              </span>
              <span>
                <strong className="text-gray-900 dark:text-white">
                  {formatFollowerCount(topic.followerCount)}
                </strong>{' '}
                followers
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <SortBar current={sort} onChange={setSort} />
      </div>

      {/* Posts list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
        {/* Initial loading skeletons */}
        {loading &&
          posts.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}

        {/* Error state */}
        {error && !loading && (
          <div className="p-8 text-center" role="alert">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No posts in this topic yet. Be the first to share!
            </p>
          </div>
        )}

        {/* Post items */}
        {posts.map((post) => (
          <article key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex gap-3">
              {post.authorAvatar ? (
                <Image
                  src={post.authorAvatar}
                  alt={post.authorName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <UserCircle className="w-9 h-9 text-gray-400 shrink-0" aria-hidden="true" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {post.authorName}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  <time
                    dateTime={post.createdAt.toISOString()}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    {getRelativeTime(post.createdAt)}
                  </time>
                </div>

                <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-white leading-snug">
                  {post.title}
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {post.body}
                </p>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" aria-hidden="true" />
                    <span>{formatFollowerCount(post.likes)}</span>
                    <span className="sr-only">likes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{formatFollowerCount(post.commentCount)}</span>
                    <span className="sr-only">comments</span>
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}

        {/* Load-more skeleton */}
        {loadingMore && <PostSkeleton />}

        {/* End of feed */}
        {!loading && !hasMore && posts.length > 0 && (
          <p className="py-4 text-center text-xs text-gray-400">You&apos;ve reached the end</p>
        )}
      </div>
    </div>
  );
}
