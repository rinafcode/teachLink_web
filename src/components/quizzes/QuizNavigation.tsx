import React from 'react';

interface QuizNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  isCompleted: boolean;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  onPrevious,
  onNext,
  onComplete,
  canGoPrevious,
  canGoNext,
  isLastQuestion,
  isCompleted,
}) => {
  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="px-4 py-2 text-[#475569] dark:text-[#CBD5E1] hover:text-[#0066FF] dark:hover:text-[#00C2FF] disabled:opacity-50 transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-3">
        {canGoNext ? (
          <button
            onClick={onNext}
            disabled={!canGoNext || isCompleted}
            className="px-4 py-2 text-[#475569] dark:text-[#CBD5E1] hover:text-[#0066FF] dark:hover:text-[#00C2FF] disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        ) : null}

        <button
          onClick={onComplete}
          disabled={isCompleted}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all disabled:opacity-50"
        >
          {isLastQuestion ? 'Complete Quiz' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  );
};
