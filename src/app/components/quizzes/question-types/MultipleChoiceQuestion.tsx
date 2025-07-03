'use client';

import { Question, Option } from '@/store/quizStore';
import { useQuizStore } from '@/store/quizStore';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface MultipleChoiceQuestionProps {
  question: Question;
  isReviewMode: boolean;
}

export default function MultipleChoiceQuestion({
  question,
  isReviewMode,
}: MultipleChoiceQuestionProps) {
  const { answers, setAnswer } = useQuizStore();
  const selectedAnswer = answers[question.id];
  const correctOption = question.options?.find((opt) => opt.isCorrect);

  const handleOptionSelect = (optionId: string) => {
    if (!isReviewMode) {
      setAnswer(question.id, optionId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      <div className="space-y-2">
        {question.options?.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.isCorrect;
          const showFeedback = isReviewMode && (isSelected || isCorrect);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isReviewMode}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } ${
                showFeedback
                  ? isCorrect
                    ? 'bg-green-50 border-green-500'
                    : isSelected
                    ? 'bg-red-50 border-red-500'
                    : ''
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {showFeedback && (
                  <span className="text-lg">
                    {isCorrect ? (
                      <FaCheck className="text-green-500" />
                    ) : isSelected ? (
                      <FaTimes className="text-red-500" />
                    ) : null}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {isReviewMode && question.explanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Explanation:</h4>
          <p className="text-gray-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
} 