'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { progressPercent, clamp } from '@/utils/videoUtils';

type AnalyticsEventType =
  | 'WATCH_HEARTBEAT'
  | 'SEEK'
  | 'SPEED_CHANGE'
  | 'QUALITY_CHANGE'
  | 'NOTE_ADDED'
  | 'BOOKMARK_ADDED'
  | 'PROGRESS_MILESTONE'
  | 'WATCH_COMPLETE';

export type PlaybackAnalyticsSnapshot = {
  watchSeconds: number;
  maxProgressPercent: number;
  seeks: number;
  speedChanges: number;
  qualityChanges: number;
  notesAdded: number;
  bookmarksAdded: number;
  completed: boolean;
};

export function usePlaybackAnalytics(opts: {
  lessonId: string;
  userId?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  qualityValue?: string; // e.g. 'auto' or a selected quality `value`
  completionThresholdPercent?: number;
  heartbeatSeconds?: number;
}) {
  const {
    lessonId,
    userId,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    qualityValue,
    completionThresholdPercent = 95,
    heartbeatSeconds = 10,
  } = opts;

  const [snapshot, setSnapshot] = useState<PlaybackAnalyticsSnapshot>({
    watchSeconds: 0,
    maxProgressPercent: 0,
    seeks: 0,
    speedChanges: 0,
    qualityChanges: 0,
    notesAdded: 0,
    bookmarksAdded: 0,
    completed: false,
  });

  const completedRef = useRef(false);
  const watchSecondsRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const maxProgressRef = useRef(0);

  const seeksRef = useRef(0);
  const speedChangesRef = useRef(0);
  const qualityChangesRef = useRef(0);
  const notesAddedRef = useRef(0);
  const bookmarksAddedRef = useRef(0);

  const milestonesRef = useRef<Set<number>>(new Set());

  const progress = useMemo(() => progressPercent(currentTime, duration), [currentTime, duration]);

  const postEvent = useCallback(
    async (eventType: AnalyticsEventType, payload: Record<string, unknown> = {}) => {
      // Fire-and-forget: analytics must never block playback.
      try {
        await apiClient.post('/api/video-analytics', {
          userId,
          lessonId,
          eventType,
          payload: {
            ...payload,
            at: new Date().toISOString(),
          },
        });
      } catch {
        // ignore
      }
    },
    [lessonId, userId],
  );

  const emitSnapshot = useCallback(() => {
    setSnapshot({
      watchSeconds: watchSecondsRef.current,
      maxProgressPercent: maxProgressRef.current,
      seeks: seeksRef.current,
      speedChanges: speedChangesRef.current,
      qualityChanges: qualityChangesRef.current,
      notesAdded: notesAddedRef.current,
      bookmarksAdded: bookmarksAddedRef.current,
      completed: completedRef.current,
    });
  }, []);

  const registerSeek = useCallback(
    (fromTime: number, toTime: number) => {
      seeksRef.current += 1;
      postEvent('SEEK', {
        fromTime,
        toTime,
        delta: toTime - fromTime,
      });
    },
    [postEvent],
  );

  const registerPlaybackRateChange = useCallback(
    (nextRate: number) => {
      speedChangesRef.current += 1;
      postEvent('SPEED_CHANGE', { nextRate });
    },
    [postEvent],
  );

  const registerQualityChange = useCallback(
    (nextQualityValue: string) => {
      qualityChangesRef.current += 1;
      postEvent('QUALITY_CHANGE', { nextQualityValue });
    },
    [postEvent],
  );

  const registerNoteAdded = useCallback(
    (noteTime: number) => {
      notesAddedRef.current += 1;
      postEvent('NOTE_ADDED', { noteTime });
    },
    [postEvent],
  );

  const registerBookmarkAdded = useCallback(
    (bookmarkTime: number) => {
      bookmarksAddedRef.current += 1;
      postEvent('BOOKMARK_ADDED', { bookmarkTime });
    },
    [postEvent],
  );

  // Watch-time + progress tracking while playing.
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = currentTime;
      return;
    }

    if (!Number.isFinite(currentTime) || currentTime < 0) return;

    const last = lastTimeRef.current;
    if (last == null) {
      lastTimeRef.current = currentTime;
      return;
    }

    const delta = currentTime - last;
    // If user scrubbed backwards, we avoid counting watch time.
    if (delta > 0 && delta < 60) {
      watchSecondsRef.current += delta;
    }
    lastTimeRef.current = currentTime;

    if (progress > maxProgressRef.current) maxProgressRef.current = progress;

    const milestones = [25, 50, 75, 90];
    for (const m of milestones) {
      if (progress >= m && !milestonesRef.current.has(m)) {
        milestonesRef.current.add(m);
        postEvent('PROGRESS_MILESTONE', { milestonePercent: m });
      }
    }

    if (progress >= completionThresholdPercent && !completedRef.current) {
      completedRef.current = true;
      // Mark lesson complete (mock PATCH endpoint exists in this repo).
      apiClient
        .patch(`/api/lessons/${encodeURIComponent(lessonId)}/progress`, { completed: true })
        .catch(() => undefined);

      postEvent('WATCH_COMPLETE', {
        watchSeconds: Math.round(watchSecondsRef.current),
        maxProgressPercent: clamp(maxProgressRef.current, 0, 100),
        seeks: seeksRef.current,
        speedChanges: speedChangesRef.current,
        qualityChanges: qualityChangesRef.current,
        notesAdded: notesAddedRef.current,
        bookmarksAdded: bookmarksAddedRef.current,
      }).finally(() => {
        emitSnapshot();
      });
    }
  }, [
    completionThresholdPercent,
    currentTime,
    emitSnapshot,
    isPlaying,
    lessonId,
    postEvent,
    progress,
  ]);

  // Heartbeat reporting while playing (engagement telemetry).
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(2000, heartbeatSeconds * 1000);
    const id = window.setInterval(() => {
      postEvent('WATCH_HEARTBEAT', {
        watchSeconds: Math.round(watchSecondsRef.current),
        maxProgressPercent: clamp(maxProgressRef.current, 0, 100),
        currentTime,
        duration,
        playbackRate,
        qualityValue: qualityValue ?? 'unknown',
      });
      emitSnapshot();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [
    currentTime,
    duration,
    emitSnapshot,
    heartbeatSeconds,
    isPlaying,
    postEvent,
    playbackRate,
    qualityValue,
  ]);

  return {
    snapshot,
    registerSeek,
    registerPlaybackRateChange,
    registerQualityChange,
    registerNoteAdded,
    registerBookmarkAdded,
  };
}

// Minimal component wrapper so AdvancedVideoPlayer can `render` analytics.
export function PlaybackAnalytics(_props: {
  lessonId: string;
  userId?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  qualityValue?: string;
}) {
  usePlaybackAnalytics({
    lessonId: _props.lessonId,
    userId: _props.userId,
    isPlaying: _props.isPlaying,
    currentTime: _props.currentTime,
    duration: _props.duration,
    playbackRate: _props.playbackRate,
    qualityValue: _props.qualityValue,
  });
  return null;
}
