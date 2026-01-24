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
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">{quiz.title}</h1>
        {quiz.description ? (
          <p className="text-[#475569] dark:text-[#CBD5E1]">{quiz.description}</p>
        ) : null}
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

      {isCompleted ? (
        <div className="mb-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white">Quiz Completed</div>
          <div className="text-[#475569] dark:text-[#CBD5E1] mt-1">
            Final Score: {score} / {maxScore}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => actions.restart()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => actions.setCurrentQuestionIndex(0)}
              className="px-4 py-2 text-[#0F172A] dark:text-white hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-colors"
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
          className="px-4 py-2 text-[#475569] dark:text-[#CBD5E1] hover:text-[#0066FF] dark:hover:text-[#00C2FF] disabled:opacity-50 transition-colors"
        >
          Previous
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={() => actions.complete()}
            disabled={isCompleted}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all disabled:opacity-50"
          >
            Complete Quiz
          </button>
        ) : (
          <button
            onClick={() => actions.goNext()}
            disabled={!quizState.canGoNext}
            className="px-4 py-2 text-[#475569] dark:text-[#CBD5E1] hover:text-[#0066FF] dark:hover:text-[#00C2FF] disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
