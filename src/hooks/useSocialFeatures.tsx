'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Activity } from '@/utils/socialUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  createdAt: Date;
}

// ─── useFollowUser ────────────────────────────────────────────────────────────

export function useFollowUser(userId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ isFollowing: boolean }>(`/api/social/follow/${userId}`)
      .then((r) => setIsFollowing(r.isFollowing))
      .catch(() => {});
  }, [userId]);

  const follow = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.post(`/api/social/follow/${userId}`, {});
      setIsFollowing(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const unfollow = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.delete(`/api/social/follow/${userId}`);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { isFollowing, follow, unfollow, loading };
}

// ─── useActivityFeed ─────────────────────────────────────────────────────────

export function useActivityFeed(userId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (nextCursor?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (nextCursor) params.set('cursor', nextCursor);
        const res = await apiClient.get<{ data: Activity[]; nextCursor?: string }>(
          `/api/social/feed/${userId}?${params}`,
        );
        setActivities((prev) =>
          nextCursor
            ? [...prev, ...res.data.map((a) => ({ ...a, createdAt: new Date(a.createdAt) }))]
            : res.data.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })),
        );
        setCursor(res.nextCursor);
        setHasMore(!!res.nextCursor);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) load(cursor);
  }, [loading, hasMore, cursor, load]);

  return { activities, loadMore, loading, hasMore };
}

// ─── useSocialInteractions ────────────────────────────────────────────────────

export function useSocialInteractions(contentId: string) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ likes: number; liked: boolean; comments: Comment[] }>(
        `/api/social/interactions/${contentId}`,
      )
      .then((r) => {
        setLikes(r.likes);
        setLiked(r.liked);
        setComments(r.comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })));
      })
      .catch(() => {});
  }, [contentId]);

  const toggleLike = useCallback(async () => {
    setLoading(true);
    try {
      if (liked) {
        await apiClient.delete(`/api/social/interactions/${contentId}/like`);
        setLikes((n) => n - 1);
        setLiked(false);
      } else {
        await apiClient.post(`/api/social/interactions/${contentId}/like`, {});
        setLikes((n) => n + 1);
        setLiked(true);
      }
    } finally {
      setLoading(false);
    }
  }, [contentId, liked]);

  const addComment = useCallback(
    async (body: string) => {
      setLoading(true);
      try {
        const comment = await apiClient.post<Comment>(
          `/api/social/interactions/${contentId}/comments`,
          { body },
        );
        setComments((prev) => [...prev, { ...comment, createdAt: new Date(comment.createdAt) }]);
      } finally {
        setLoading(false);
      }
    },
    [contentId],
  );

  return { likes, liked, comments, toggleLike, addComment, loading };
}
