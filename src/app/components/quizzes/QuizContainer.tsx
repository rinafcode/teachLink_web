'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Countdown from 'react-countdown';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import QuestionCard from './QuestionCard';

interface QuizContainerProps {
  quiz: Quiz;
}

export default function QuizContainer({ quiz }: QuizContainerProps) {
  const router = useRouter();
  const {
    currentQuestionIndex,
    answers,
    isReviewMode,
    startTime,
    endTime,
    setCurrentQuiz,
    nextQuestion,
    previousQuestion,
    startQuiz,
    endQuiz,
    toggleReviewMode,
    resetQuiz,
  } = useQuizStore();

  useEffect(() => {
    setCurrentQuiz(quiz);
    startQuiz();
    return () => {
      resetQuiz();
    };
  }, [quiz, setCurrentQuiz, startQuiz, resetQuiz]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = Object.keys(answers).length;

  const handleComplete = () => {
    endQuiz();
    toggleReviewMode();
  };

  const renderTimer = () => {
    if (!quiz.timeLimit || isReviewMode) return null;

    return (
      <div className="text-lg font-medium text-gray-700">
        Time Remaining:{' '}
        <Countdown
          date={startTime ? startTime.getTime() + quiz.timeLimit * 1000 : 0}
          onComplete={handleComplete}
          renderer={({ minutes, seconds }) => (
            <span>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          )}
        />
      </div>
    );
  };

  const renderProgress = () => {
    return (
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        <div>
          {answeredQuestions} of {totalQuestions} answered
        </div>
      </div>
    );
  };

  const renderNavigation = () => {
    if (isReviewMode) {
      return (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.push('/courses')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back to Course
          </button>
          <button
            onClick={() => {
              resetQuiz();
              router.push('/courses');
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-between mt-6">
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <FaArrowLeft />
          Previous
        </button>
        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Complete Quiz
            <FaCheck />
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Next
            <FaArrowRight />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-gray-600">{quiz.description}</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        {renderTimer()}
        {renderProgress()}
      </div>

      <QuestionCard question={currentQuestion} />
      {renderNavigation()}
    </div>
  );
} 