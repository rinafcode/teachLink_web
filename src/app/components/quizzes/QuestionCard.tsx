'use client';

import { Question } from '@/app/store/quizStore';
import MultipleChoiceQuestion from './question-types/MultipleChoiceQuestion';
import TrueFalseQuestion from './question-types/TrueFalseQuestion';
import dynamic from 'next/dynamic';

const CodeChallengeQuestion = dynamic(() => import('./question-types/CodeChallengeQuestion'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false,
});

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion question={question} />;
      case 'true-false':
        return <TrueFalseQuestion question={question} />;
      case 'code-challenge':
        return <CodeChallengeQuestion question={question} />;
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
