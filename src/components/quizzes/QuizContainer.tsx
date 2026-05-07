'use client';

import React, { useCallback } from 'react';
import QuestionCard from './QuestionCard';
import { Quiz, useQuiz } from '@/hooks/useQuiz';

import { QuizHeader } from './QuizHeader';
import { QuizCompletionCard } from './QuizCompletionCard';
import { QuizNavigation } from './QuizNavigation';

interface QuizContainerProps {
  quiz: Quiz;
}

const QuizContainer = React.memo(({ quiz }: QuizContainerProps) => {
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

  const handleRestart = useCallback(() => actions.restart(), [actions]);
  const handleReviewAnswers = useCallback(() => actions.setCurrentQuestionIndex(0), [actions]);
  const handleGoPrevious = useCallback(() => actions.goPrevious(), [actions]);
  const handleGoNext = useCallback(() => actions.goNext(), [actions]);
  const handleComplete = useCallback(() => actions.complete(), [actions]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <QuizHeader
        title={quiz.title}
        description={quiz.description}
        timeRemainingSeconds={timeRemainingSeconds}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        score={score}
        maxScore={maxScore}
        isReviewMode={isReviewMode}
      />

      {isCompleted ? (
        <QuizCompletionCard
          score={score}
          maxScore={maxScore}
          onRestart={handleRestart}
          onReview={handleReviewAnswers}
        />
      ) : null}

      <QuestionCard question={currentQuestion} quizState={quizState} />

      <QuizNavigation
        onPrevious={handleGoPrevious}
        onNext={handleGoNext}
        onComplete={handleComplete}
        canGoPrevious={quizState.canGoPrevious}
        canGoNext={quizState.canGoNext}
        isLastQuestion={currentQuestionIndex === totalQuestions - 1}
        isCompleted={isCompleted}
      />
    </div>
  );
});

QuizContainer.displayName = 'QuizContainer';

export default QuizContainer;
