'use client';

import type { TrueFalseQuizQuestion, UseQuizReturn } from '@/hooks/useQuiz';

interface TrueFalseQuestionProps {
  question: TrueFalseQuizQuestion;
  quizState: UseQuizReturn;
}

export default function TrueFalseQuestion({ question, quizState }: TrueFalseQuestionProps) {
  const { answers, isReviewMode, isCompleted, actions } = quizState;
  const selected = answers[question.id]?.value;
  const hasAnswered = Boolean(answers[question.id]);

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      <div className="flex gap-4">
        {(['true', 'false'] as const).map((option) => {
          const isSelected = selected === option;
          const shouldReveal = (hasAnswered || isReviewMode || isCompleted) && (isSelected || option === question.correctAnswer);
          const isCorrect = option === question.correctAnswer;

          const colorClasses = shouldReveal
            ? isCorrect
              ? 'border-[#0066FF] dark:border-[#00C2FF] bg-[#F0F9FF] dark:bg-[#1E3A8A]/20'
              : isSelected
              ? 'border-red-500 bg-red-50'
              : 'border-[#E2E8F0] dark:border-[#334155]'
            : isSelected
            ? 'border-[#0066FF] dark:border-[#00C2FF] bg-[#F0F9FF] dark:bg-[#1E3A8A]/20'
            : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#CBD5E1] dark:hover:border-[#475569]';

          return (
            <button
              key={option}
              onClick={() => actions.answerQuestion(question.id, option)}
              disabled={hasAnswered || isReviewMode || isCompleted}
              className={`flex-1 p-4 text-center rounded-lg border transition-colors ${colorClasses} disabled:opacity-75`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="capitalize text-[#0F172A] dark:text-white">{option}</span>
                {shouldReveal ? (
                  isCorrect ? (
                    <span className="text-[#0066FF] dark:text-[#00C2FF] text-sm font-medium">Correct</span>
                  ) : isSelected ? (
                    <span className="text-red-700 text-sm font-medium">Your answer</span>
                  ) : null
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
