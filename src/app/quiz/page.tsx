'use client';

import QuizContainer from '@/components/quizzes/QuizContainer';
import type { Quiz } from '@/hooks/useQuiz';

const demoQuiz: Quiz = {
  id: 'demo-quiz',
  title: 'Quiz',
  description: 'Preview of multiple question types with feedback, scoring, review mode, and timer.',
  timeLimit: 120,
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'Which of the following is a JavaScript primitive type?',
      points: 2,
      explanation: 'JavaScript primitives include string, number, boolean, null, undefined, symbol, and bigint.',
      options: [
        { id: 'a', text: 'Array', isCorrect: false },
        { id: 'b', text: 'string', isCorrect: true },
        { id: 'c', text: 'Date', isCorrect: false },
        { id: 'd', text: 'Map', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      type: 'true-false',
      text: 'In React, state updates may be batched and applied asynchronously.',
      points: 1,
      explanation: 'React may batch updates for performance; state setting isn’t always immediate.',
      correctAnswer: 'true',
    },
    {
      id: 'q3',
      type: 'code-challenge',
      text: "Write code that returns the input string uppercased. The function receives 'input' as a string.",
      points: 3,
      explanation: "One solution: return input.toUpperCase();",
      codeTemplate: "return input.toUpperCase();",
      language: 'javascript',
      testCases: [
        { input: 'hello', expectedOutput: 'HELLO' },
        { input: 'TeachLink', expectedOutput: 'TEACHLINK' },
      ],
    },
  ],
};

export default function QuizDemoPage() {
  return <QuizContainer quiz={demoQuiz} />;
}
