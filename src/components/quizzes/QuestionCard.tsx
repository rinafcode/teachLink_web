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
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">{question.points} points</div>
        {showFeedback ? (
          <div
            className={`text-sm font-medium ${
              answer?.feedback === 'correct'
                ? 'text-[#0066FF] dark:text-[#00C2FF]'
                : 'text-red-700'
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
        <div className="mt-6 p-4 bg-[#F1F5F9] dark:bg-[#334155] rounded-lg">
          <div className="font-medium mb-2 text-[#0F172A] dark:text-white">Explanation:</div>
          <p className="text-[#475569] dark:text-[#CBD5E1]">{question.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
