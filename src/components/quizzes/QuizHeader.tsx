import React from 'react';
import { formatTime } from '@/utils/quizUtils';

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
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">{title}</h1>
        {description ? <p className="text-[#475569] dark:text-[#CBD5E1]">{description}</p> : null}
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex flex-col">
          {typeof timeRemainingSeconds === 'number' && !isReviewMode ? (
            <div className="text-lg font-medium text-[#0F172A] dark:text-white">
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
    </>
  );
};
