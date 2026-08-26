import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizContainer from '../QuizContainer';
import { useQuiz, type Quiz, type UseQuizResult } from '@/hooks/useQuiz';

// Mock the useQuiz hook
vi.mock('@/hooks/useQuiz');

const mockQuiz: Quiz = {
  id: 'test-quiz',
  title: 'Test Quiz',
  description: 'A quiz for testing purposes.',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'What is 2 + 2?',
      points: 1,
      options: [
        { id: 'a', text: '4', isCorrect: true },
        { id: 'b', text: '3', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      text: 'What is the capital of France?',
      points: 1,
      type: 'multiple-choice',
      options: [
        { id: 'a', text: 'Paris', isCorrect: true },
        { id: 'b', text: 'London', isCorrect: false },
      ],
    },
  ],
};

const mockQuizState: UseQuizResult = {
  currentQuestion: mockQuiz.questions[0],
  currentQuestionIndex: 0,
  answeredCount: 0,
  score: 0,
  maxScore: 2,
  isCompleted: false,
  isReviewMode: false,
  timeRemainingSeconds: 300,
  canGoPrevious: false,
  canGoNext: true,
  answers: {},
  actions: {
    answerQuestion: vi.fn(),
    setCodeChallengeResult: vi.fn(),
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    setCurrentQuestionIndex: vi.fn(),
    complete: vi.fn(),
    restart: vi.fn(),
  },
};

describe('QuizContainer', () => {
  it('should render the question card and navigation when the quiz is in progress', () => {
    (useQuiz as vi.Mock).mockReturnValue({
      ...mockQuizState,
      isCompleted: false,
    });

    render(<QuizContainer quiz={mockQuiz} />);

    // The question card should be visible
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();

    // The navigation buttons should be visible
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();

    // The completion card should not be visible
    expect(screen.queryByText(/Quiz Completed/i)).not.toBeInTheDocument();
  });

  it('should render only the completion card when the quiz is completed', () => {
    (useQuiz as vi.Mock).mockReturnValue({
      ...mockQuizState,
      isCompleted: true,
      score: 2,
    });

    render(<QuizContainer quiz={mockQuiz} />);

    // The completion card should be visible
    expect(screen.getByText(/Quiz Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Final Score:\s*2\s*\/\s*2/i)).toBeInTheDocument();

    // The question card should not be visible
    expect(screen.queryByText('What is 2 + 2?')).not.toBeInTheDocument();

    // The navigation should not be visible
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });
});
