import React from 'react';

interface QuizCompletionCardProps {
  score: number;
  maxScore: number;
  onRestart: () => void;
  onReview: () => void;
}

export const QuizCompletionCard: React.FC<QuizCompletionCardProps> = ({
  score,
  maxScore,
  onRestart,
  onReview,
}) => {
  return (
    <div className="mb-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4">
      <div className="text-lg font-semibold text-[#0F172A] dark:text-white">Quiz Completed</div>
      <div className="text-[#475569] dark:text-[#CBD5E1] mt-1">
        Final Score: {score} / {maxScore}
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={onRestart}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={onReview}
          className="px-4 py-2 text-[#0F172A] dark:text-white hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-colors"
        >
          Review Answers
        </button>
      </div>
    </div>
  );
};
