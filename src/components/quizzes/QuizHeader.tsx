import React, { useMemo } from 'react';
import { formatTime } from '@/utils/quizUtils';

/**
 * Time thresholds (in seconds) at which the timer announces to screen readers.
 * Early thresholds are coarse; near the end we announce every second.
 */
const ANNOUNCEMENT_THRESHOLDS: readonly number[] = [
  600, 300, 120, 60, 30, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
];

interface QuizHeaderProps {
  title: string;
  description?: string;
  timeRemainingSeconds?: number | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  score: number;
  maxScore: number;
  isReviewMode: boolean;
}

/**
 * Build a human-friendly announcement string for a given number of seconds.
 */
function getTimeAnnouncement(seconds: number): string {
  if (seconds <= 0) return 'Time is up!';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0 && secs === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''} remaining`;
  }
  return `${secs} second${secs !== 1 ? 's' : ''} remaining`;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  description,
  timeRemainingSeconds,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  score,
  maxScore,
  isReviewMode,
}) => {
  /**
   * Compute screen-reader announcement text only at predefined thresholds.
   * Returns empty string when no announcement is needed, so the
   * aria-live region's content stays stable between thresholds.
   */
  const srAnnouncement = useMemo<string>(() => {
    if (typeof timeRemainingSeconds !== 'number' || isReviewMode) return '';
    if (ANNOUNCEMENT_THRESHOLDS.includes(timeRemainingSeconds)) {
      return getTimeAnnouncement(timeRemainingSeconds);
    }
    return '';
  }, [timeRemainingSeconds, isReviewMode]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">{title}</h1>
        {description ? <p className="text-[#475569] dark:text-[#CBD5E1]">{description}</p> : null}
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex flex-col">
          {typeof timeRemainingSeconds === 'number' && !isReviewMode ? (
            <div
              role="timer"
              aria-label={`Time remaining: ${formatTime(timeRemainingSeconds)}`}
              className="text-lg font-medium text-[#0F172A] dark:text-white"
            >
              Time Remaining: {formatTime(timeRemainingSeconds)}
            </div>
          ) : null}
          <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {answeredCount} of {totalQuestions} answered
          </div>
          <div className="text-sm font-medium text-[#0F172A] dark:text-white">
            Score: {score} / {maxScore}
          </div>
        </div>
      </div>

      {/*
        Visually hidden live region that announces time remaining
        only at predefined thresholds so the screen reader isn't
        flooded with every-second tick announcements.
      */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>
    </>
  );
};
