'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Topic, TopicPost } from '@/utils/socialUtils';

export type SortOption = 'latest' | 'popular' | 'oldest';

interface UseTopicFeedReturn {
  topic: Topic | null;
  posts: TopicPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  sort: SortOption;
  setSort: (s: SortOption) => void;
  loadMore: () => void;
  retry: () => void;
  toggleFollow: () => Promise<void>;
  followLoading: boolean;
  error: string | null;
}

export function useTopicFeed(slug: string): UseTopicFeedReturn {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<TopicPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortOption>('latest');
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchPosts = useCallback(
    async (nextCursor?: string, currentSort: SortOption = sort) => {
      const isInitial = !nextCursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: '20', sort: currentSort });
        if (nextCursor) params.set('cursor', nextCursor);

        const [topicRes, postsRes] = await Promise.all([
          isInitial
            ? apiClient.get<Topic>(`/api/topics/${slug}`)
            : Promise.resolve(null as unknown as Topic),
          apiClient.get<{ data: TopicPost[]; nextCursor?: string }>(
            `/api/topics/${slug}/posts?${params}`,
          ),
        ]);

        if (isInitial && topicRes) setTopic(topicRes);

        const normalized = postsRes.data.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));

        setPosts((prev) => (isInitial ? normalized : [...prev, ...normalized]));
        setCursor(postsRes.nextCursor);
        setHasMore(!!postsRes.nextCursor);
      } catch {
        setError('Failed to load topic feed. Please try again.');
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [slug, sort],
  );

  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    fetchPosts(undefined, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, sort]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && cursor) fetchPosts(cursor);
  }, [loadingMore, hasMore, cursor, fetchPosts]);

  const retry = useCallback(() => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    fetchPosts(undefined, sort);
  }, [fetchPosts, sort]);

  const toggleFollow = useCallback(async () => {
    if (!topic || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = topic.isFollowing;
    // Optimistic update
    setTopic((t) =>
      t
        ? {
            ...t,
            isFollowing: !wasFollowing,
            followerCount: t.followerCount + (wasFollowing ? -1 : 1),
          }
        : t,
    );
    try {
      await apiClient.post(`/api/topics/${slug}/follow`, { follow: !wasFollowing });
    } catch {
      // Revert on failure
      setTopic((t) =>
        t
          ? {
              ...t,
              isFollowing: wasFollowing,
              followerCount: t.followerCount + (wasFollowing ? 1 : -1),
            }
          : t,
      );
    } finally {
      setFollowLoading(false);
    }
  }, [topic, followLoading, slug]);

  const handleSetSort = useCallback((s: SortOption) => setSort(s), []);

  return {
    topic,
    posts,
    loading,
    loadingMore,
    hasMore,
    sort,
    setSort: handleSetSort,
    loadMore,
    retry,
    toggleFollow,
    followLoading,
    error,
  };
}
