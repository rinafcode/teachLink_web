'use client';

import type { MultipleChoiceQuizQuestion, UseQuizReturn } from '@/hooks/useQuiz';

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuizQuestion;
  quizState: UseQuizReturn;
}

export default function MultipleChoiceQuestion({
  question,
  quizState,
}: MultipleChoiceQuestionProps) {
  const { answers, isReviewMode, isCompleted, actions } = quizState;
  const selected = answers[question.id]?.value;
  const hasAnswered = Boolean(answers[question.id]);

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const shouldReveal = (hasAnswered || isReviewMode || isCompleted) && (isSelected || option.isCorrect);

          const colorClasses = shouldReveal
            ? option.isCorrect
              ? 'border-green-500 bg-green-50'
              : isSelected
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200'
            : isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300';

          return (
            <button
              key={option.id}
              onClick={() => actions.answerQuestion(question.id, option.id)}
              disabled={hasAnswered || isReviewMode || isCompleted}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${colorClasses} disabled:opacity-75`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {shouldReveal ? (
                  option.isCorrect ? (
                    <span className="text-green-700 text-sm font-medium">Correct</span>
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
