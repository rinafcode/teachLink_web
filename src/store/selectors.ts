/**
 * Centralised store selectors.
 * Import from here instead of accessing store state inline to keep
 * components decoupled from store internals.
 */

import { useSearchStore } from '@/app/store/searchStore';
import { useNotificationStore } from '@/app/store/notificationStore';
import { useQuizStore } from '@/app/store/quizStore';

// â”€â”€ Search selectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useSearchFilters = () =>
  useSearchStore((s) => ({
    difficulty: s.difficulty,
    duration: s.duration,
    topics: s.topics,
    instructors: s.instructors,
    sortBy: s.sortBy,
    price: s.price,
  }));

export const useSearchHistory = () => useSearchStore((s) => s.searchHistory);

// â”€â”€ Notification selectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useUnreadNotifications = () =>
  useNotificationStore((s) => s.notifications.filter((n) => !n.read));

export const useUnreadCount = () =>
  useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

// â”€â”€ Quiz selectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const useCurrentQuestion = () =>
  useQuizStore((s) =>
    s.currentQuiz ? s.currentQuiz.questions[s.currentQuestionIndex] ?? null : null,
  );

export const useQuizProgress = () =>
  useQuizStore((s) => ({
    current: s.currentQuestionIndex + 1,
    total: s.currentQuiz?.questions.length ?? 0,
    isReviewMode: s.isReviewMode,
  }));