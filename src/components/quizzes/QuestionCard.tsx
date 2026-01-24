'use client';

import MultipleChoiceQuestion from './question-types/MultipleChoiceQuestion';
import TrueFalseQuestion from './question-types/TrueFalseQuestion';
import CodeChallengeQuestion from './question-types/CodeChallengeQuestion';
import type { QuizQuestion, UseQuizReturn } from '@/hooks/useQuiz';

interface QuestionCardProps {
  question: QuizQuestion;
  quizState: UseQuizReturn;
}

export default function QuestionCard({ question, quizState }: QuestionCardProps) {
  const answer = quizState.answers[question.id];
  const showFeedback = Boolean(answer?.feedback);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">{question.points} points</div>
        {showFeedback ? (
          <div
            className={`text-sm font-medium ${
              answer?.feedback === 'correct' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {answer?.feedback === 'correct' ? 'Correct' : 'Incorrect'}
          </div>
        ) : null}
      </div>

      {question.type === 'multiple-choice' ? (
        <MultipleChoiceQuestion question={question} quizState={quizState} />
      ) : question.type === 'true-false' ? (
        <TrueFalseQuestion question={question} quizState={quizState} />
      ) : question.type === 'code-challenge' ? (
        <CodeChallengeQuestion question={question} quizState={quizState} />
      ) : (
        <div>Unsupported question type</div>
      )}

      {quizState.isReviewMode && question.explanation ? (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="font-medium mb-2">Explanation:</div>
          <p className="text-gray-700">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
