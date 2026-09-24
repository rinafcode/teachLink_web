import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../useQuiz';
import { Quiz, QuestionType } from '@/types/quiz';

// Realistic mock data for a quiz with a time limit
const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      type: QuestionType.MULTIPLE_CHOICE,
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: '4',
      points: 1,
    },
  ],
  timeLimit: 10, // 10 seconds for testing auto-submit
  passingScore: 1,
};

describe('useQuiz', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Existing tests for grading helpers (assumed from codebase context)
  describe('grading helpers', () => {
    it('should calculate score correctly', () => {
      const { result } = renderHook(() => useQuiz(mockQuiz));
      act(() => {
        result.current.actions.answerQuestion('q1', '4');
      });
      expect(result.current.state.score).toBe(1);
    });
  });

  // Existing tests for answer and score flow (assumed from codebase context)
  describe('answer and score flow', () => {
    it('should handle answer submission and scoring', () => {
      const { result } = renderHook(() => useQuiz(mockQuiz));
      act(() => {
        result.current.actions.answerQuestion('q1', '4');
      });
      expect(result.current.state.answers).toHaveProperty('q1', '4');
    });
  });

  // New tests for timer auto-submit functionality
  describe('timer auto-submit on expiry', () => {
    it('should call complete and set isCompleted when timer expires', () => {
      const { result } = renderHook(() => useQuiz(mockQuiz));

      // Start the quiz timer
      act(() => {
        result.current.actions.startQuiz();
      });

      // Verify timer is running by checking remaining time
      expect(result.current.state.remainingTime).toBe(mockQuiz.timeLimit);

      // Advance time to the expiry moment
      act(() => {
        vi.advanceTimersByTime(mockQuiz.timeLimit * 1000);
      });

      // Assert that the timer auto-submits: complete is called and isCompleted is true
      expect(result.current.state.isCompleted).toBe(true);
      // The hook should have invoked complete() internally, setting the state
      expect(result.current.state.remainingTime).toBe(0);
    });

    it('should clear the timer upon completion', () => {
      const { result } = renderHook(() => useQuiz(mockQuiz));

      act(() => {
        result.current.actions.startQuiz();
      });

      // Complete the quiz manually before expiry
      act(() => {
        result.current.actions.complete();
      });

      expect(result.current.state.isCompleted).toBe(true);

      // Advance time beyond the original expiry
      act(() => {
        vi.advanceTimersByTime(mockQuiz.timeLimit * 1000 + 5000);
      });

      // The timer should have been cleared, so no additional side effects occur
      // isCompleted remains true, and the interval is stopped
      expect(result.current.state.isCompleted).toBe(true);
      // Assuming the hook clears the interval on completion, so no further decrements
      expect(result.current.state.remainingTime).toBe(0);
    });

    it('should not run timer in review mode', () => {
      // UseQuiz hook should support review mode via an option parameter
      const { result } = renderHook(() => useQuiz(mockQuiz, { reviewMode: true }));

      // In review mode, the timer should not start or auto-submit
      act(() => {
        vi.advanceTimersByTime(mockQuiz.timeLimit * 1000);
      });

      // isCompleted should remain false since the quiz is not started for submission
      expect(result.current.state.isCompleted).toBe(false);
      // remainingTime should not change as the timer is not active
      expect(result.current.state.remainingTime).toBeUndefined();
    });
  });
});