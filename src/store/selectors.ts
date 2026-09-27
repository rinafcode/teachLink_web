/**
 * Centralised store selectors.
 * Import from here instead of accessing store state inline to keep
 * components decoupled from store internals.
 *
 * Selectors that derive a new object or array are memoized. Zustand compares a
 * selector's result with `Object.is` to decide whether to re-render, so a
 * selector returning a fresh `filter(...)` result re-renders every subscriber
 * on every unrelated store update — and recomputes the filter each time.
 * Memoizing by input identity returns the previous reference when the inputs
 * are unchanged, and `useShallow` covers the small object literals where a
 * per-field comparison is cheaper than caching.
 */

import { useShallow } from 'zustand/react/shallow';
import { useSearchStore } from '@/app/store/searchStore';
import { useNotificationStore } from '@/app/store/notificationStore';
import { useQuizStore } from '@/app/store/quizStore';
import { memoizeByInputs } from './stateManager';
import type { AppNotification } from '@/lib/notifications/types';

// ── Search selectors ────────────────────────────────────────────────────────
export const useSearchFilters = () =>
  useSearchStore(
    useShallow((s) => ({
      difficulty: s.difficulty,
      duration: s.duration,
      topics: s.topics,
      instructors: s.instructors,
      sortBy: s.sortBy,
      price: s.price,
    })),
  );

export const useSearchHistory = () => useSearchStore((s) => s.searchHistory);

// ── Notification selectors ──────────────────────────────────────────────────

/**
 * Unread notifications, cached against the notifications array reference.
 *
 * The store keeps up to 200 notifications and rewrites the whole array on
 * every mutation, so the filter is worth skipping when nothing has changed.
 */
export const selectUnreadNotifications = memoizeByInputs(
  (notifications: readonly AppNotification[]) => notifications.filter((n) => !n.read),
);

export const useUnreadNotifications = () =>
  useNotificationStore((s) => selectUnreadNotifications(s.notifications));

/**
 * Count of unread notifications.
 *
 * Derived from the same memoized array rather than filtering a second time,
 * so a component showing both the badge and the list costs one pass.
 */
export const useUnreadCount = () =>
  useNotificationStore((s) => selectUnreadNotifications(s.notifications).length);

// ── Quiz selectors ──────────────────────────────────────────────────────────
export const useCurrentQuestion = () =>
  useQuizStore((s) =>
    s.currentQuiz ? s.currentQuiz.questions[s.currentQuestionIndex] ?? null : null,
  );

export const useQuizProgress = () =>
  useQuizStore(
    useShallow((s) => ({
      current: s.currentQuestionIndex + 1,
      total: s.currentQuiz?.questions.length ?? 0,
      isReviewMode: s.isReviewMode,
    })),
  );
