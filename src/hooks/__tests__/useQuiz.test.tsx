import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  gradeCodeChallengeSubmission,
  normalizeQuizOutput,
  useQuiz,
  type CodeChallengeQuizQuestion,
  type Quiz,
} from '../useQuiz';

const quizFixture: Quiz = {
  id: 'quiz-1',
  title: 'Grading fixture',
  questions: [
    {
      id: 'mc-1',
      type: 'multiple-choice',
      text: 'Pick the correct answer',
      points: 2,
      options: [
        { id: 'a', text: 'Wrong', isCorrect: false },
        { id: 'b', text: 'Right', isCorrect: true },
      ],
    },
    {
      id: 'code-1',
      type: 'code-challenge',
      text: 'Return the input value.',
      points: 4,
      gradingPolicy: {
        partialCredit: true,
        normalizeWhitespace: true,
      },
      testCases: [
        { input: 'hello', expectedOutput: 'hello' },
        { input: 'TeachLink', expectedOutput: 'TeachLink' },
        { input: 'white space', expectedOutput: 'white space' },
      ],
    },
  ],
};

describe('quiz grading helpers', () => {
  it('normalizes output according to the configured tolerations', () => {
    expect(
      normalizeQuizOutput('  Hello\r\nWorld  ', {
        normalizeWhitespace: true,
        normalizeCase: true,
      }),
    ).toBe('hello world');
  });

  it('grants partial credit for partially passing code challenges', () => {
    const result = gradeCodeChallengeSubmission(
      quizFixture.questions[1] as CodeChallengeQuizQuestion,
      [true, false, true],
    );

    expect(result.feedback).toBe('partial');
    expect(result.isCorrect).toBe(false);
    expect(result.earnedPoints).toBe(2);
    expect(result.meta).toMatchObject({
      passRate: 2 / 3,
      passedTests: 2,
      totalTests: 3,
      tainted: true,
      tolerated: true,
      partialCreditEnabled: true,
    });
  });
});

describe('useQuiz', () => {
  it('ignores a second answer to an already-answered question', () => {
    const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

    act(() => {
      result.current.actions.answerQuestion('mc-1', 'b'); // correct
    });

    const firstAnswer = result.current.answers['mc-1'];

    act(() => {
      result.current.actions.answerQuestion('mc-1', 'a'); // attempt to change to wrong
    });

    expect(result.current.answers['mc-1']).toBe(firstAnswer);
    expect(result.current.score).toBe(2);
  });

  it('tracks partial code-credit and regular grading without regressing score updates', () => {
    const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

    act(() => {
      result.current.actions.answerQuestion('mc-1', 'b');
    });

    act(() => {
      result.current.actions.setCodeChallengeResult('code-1', {
        code: 'return input;',
        testResults: [true, false, true],
      });
    });

    expect(result.current.score).toBe(4);
    expect(result.current.answeredCount).toBe(2);
    expect(result.current.answers['mc-1']).toMatchObject({
      isCorrect: true,
      earnedPoints: 2,
      feedback: 'correct',
    });
    expect(result.current.answers['code-1']).toMatchObject({
      isCorrect: false,
      earnedPoints: 2,
      feedback: 'partial',
    });
    expect(result.current.answers['code-1'].meta).toMatchObject({
      tainted: true,
      tolerated: true,
      partialCreditEnabled: true,
    });
  });

  describe('navigation bounds', () => {
    it('goPrevious at the first question clamps to index 0', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      expect(result.current.currentQuestionIndex).toBe(0);

      act(() => {
        result.current.actions.goPrevious();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('goNext advances and goPrevious goes back within bounds', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      act(() => {
        result.current.actions.goNext();
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      act(() => {
        result.current.actions.goPrevious();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('goNext at the last question clamps to questions.length - 1', () => {
      const multiQuestionFixture: Quiz = {
        ...quizFixture,
        questions: [
          ...quizFixture.questions,
          {
            id: 'mc-2',
            type: 'multiple-choice',
            text: 'Third question',
            points: 1,
            options: [
              { id: 'a', text: 'Wrong', isCorrect: false },
              { id: 'b', text: 'Right', isCorrect: true },
            ],
          },
        ],
      };

      const { result } = renderHook(() => useQuiz({ quiz: multiQuestionFixture, autoStart: false }));

      act(() => {
        result.current.actions.goNext();
      });
      act(() => {
        result.current.actions.goNext();
      });

      expect(result.current.currentQuestionIndex).toBe(2);

      act(() => {
        result.current.actions.goNext();
      });

      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('canGoNext and canGoPrevious reflect boundary state', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.canGoNext).toBe(true);

      act(() => {
        result.current.actions.goNext();
      });

      expect(result.current.canGoPrevious).toBe(true);
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe('review-mode guards', () => {
    it('enterReviewMode is a no-op before the quiz is completed', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      act(() => {
        result.current.actions.enterReviewMode();
      });

      expect(result.current.isReviewMode).toBe(false);
    });

    it('exitReviewMode is a no-op before the quiz is completed', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      act(() => {
        result.current.actions.exitReviewMode();
      });

      expect(result.current.isReviewMode).toBe(false);
    });

    it('enterReviewMode sets isReviewMode after completion', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      act(() => {
        result.current.actions.complete();
      });

      expect(result.current.isReviewMode).toBe(true);
    });

    it('exitReviewMode clears isReviewMode after completion', () => {
      const { result } = renderHook(() => useQuiz({ quiz: quizFixture, autoStart: false }));

      act(() => {
        result.current.actions.complete();
      });

      expect(result.current.isReviewMode).toBe(true);

      act(() => {
        result.current.actions.exitReviewMode();
      });

      expect(result.current.isReviewMode).toBe(false);
    });
  });
});
