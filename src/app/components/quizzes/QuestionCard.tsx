'use client';

import { Question } from '@/store/quizStore';
import MultipleChoiceQuestion from './question-types/MultipleChoiceQuestion';
import TrueFalseQuestion from './question-types/TrueFalseQuestion';
import CodeChallengeQuestion from './question-types/CodeChallengeQuestion';
import { useQuizStore } from '@/store/quizStore';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const { isReviewMode } = useQuizStore();

  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            isReviewMode={isReviewMode}
          />
        );
      case 'true-false':
        return (
          <TrueFalseQuestion question={question} isReviewMode={isReviewMode} />
        );
      case 'code-challenge':
        return (
          <CodeChallengeQuestion
            question={question}
            isReviewMode={isReviewMode}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Question {question.id} • {question.points} points
        </div>
      </div>
      {renderQuestion()}
    </div>
  );
} 