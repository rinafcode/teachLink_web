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
              ? 'border-green-500 bg-green-50'
              : isSelected
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200'
            : isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300';

          return (
            <button
              key={option}
              onClick={() => actions.answerQuestion(question.id, option)}
              disabled={hasAnswered || isReviewMode || isCompleted}
              className={`flex-1 p-4 text-center rounded-lg border transition-colors ${colorClasses} disabled:opacity-75`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="capitalize">{option}</span>
                {shouldReveal ? (
                  isCorrect ? (
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
