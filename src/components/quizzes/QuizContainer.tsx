'use client';

import QuestionCard from './QuestionCard';
import { Quiz, useQuiz } from '@/hooks/useQuiz';

interface QuizContainerProps {
  quiz: Quiz;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function QuizContainer({ quiz }: QuizContainerProps) {
  const quizState = useQuiz({ quiz, autoStart: true });

  const {
    currentQuestion,
    currentQuestionIndex,
    answeredCount,
    score,
    maxScore,
    isCompleted,
    isReviewMode,
    timeRemainingSeconds,
    actions,
  } = quizState;

  const totalQuestions = quiz.questions.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        {quiz.description ? <p className="text-gray-600">{quiz.description}</p> : null}
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex flex-col">
          {typeof timeRemainingSeconds === 'number' && !isReviewMode ? (
            <div className="text-lg font-medium text-gray-700">
              Time Remaining: {formatTime(timeRemainingSeconds)}
            </div>
          ) : null}
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">
            {answeredCount} of {totalQuestions} answered
          </div>
          <div className="text-sm font-medium text-gray-800">
            Score: {score} / {maxScore}
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-lg font-semibold text-gray-900">Quiz Completed</div>
          <div className="text-gray-700 mt-1">
            Final Score: {score} / {maxScore}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => actions.restart()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={() => actions.setCurrentQuestionIndex(0)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Review Answers
            </button>
          </div>
        </div>
      ) : null}

      <QuestionCard question={currentQuestion} quizState={quizState} />

      <div className="flex justify-between mt-6">
        <button
          onClick={() => actions.goPrevious()}
          disabled={!quizState.canGoPrevious}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Previous
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={() => actions.complete()}
            disabled={isCompleted}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Complete Quiz
          </button>
        ) : (
          <button
            onClick={() => actions.goNext()}
            disabled={!quizState.canGoNext}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
