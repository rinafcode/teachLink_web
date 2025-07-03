'use client';

import { Question } from '@/store/quizStore';
import { useQuizStore } from '@/store/quizStore';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface TrueFalseQuestionProps {
  question: Question;
  isReviewMode: boolean;
}

export default function TrueFalseQuestion({
  question,
  isReviewMode,
}: TrueFalseQuestionProps) {
  const { answers, setAnswer } = useQuizStore();
  const selectedAnswer = answers[question.id];
  const correctAnswer = question.correctAnswer;

  const handleAnswerSelect = (answer: string) => {
    if (!isReviewMode) {
      setAnswer(question.id, answer);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      <div className="flex gap-4">
        {['true', 'false'].map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showFeedback = isReviewMode && (isSelected || isCorrect);

          return (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              disabled={isReviewMode}
              className={`flex-1 p-4 text-center rounded-lg border transition-colors ${
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
              <div className="flex items-center justify-center gap-2">
                <span className="capitalize">{option}</span>
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