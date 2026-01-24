'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'code-challenge';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface CodeTestCase {
  input: string;
  expectedOutput: string;
}

export interface QuizQuestionBase {
  id: string;
  type: QuizQuestionType;
  text: string;
  points: number;
  explanation?: string;
}

export interface MultipleChoiceQuizQuestion extends QuizQuestionBase {
  type: 'multiple-choice';
  options: QuizOption[];
}

export interface TrueFalseQuizQuestion extends QuizQuestionBase {
  type: 'true-false';
  correctAnswer: 'true' | 'false';
}

export interface CodeChallengeQuizQuestion extends QuizQuestionBase {
  type: 'code-challenge';
  codeTemplate?: string;
  language?: string;
  testCases?: CodeTestCase[];
}

export type QuizQuestion =
  | MultipleChoiceQuizQuestion
  | TrueFalseQuizQuestion
  | CodeChallengeQuizQuestion;

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  questions: QuizQuestion[];
}

export type QuizFeedbackStatus = 'correct' | 'incorrect' | null;

export interface QuizAnswerRecord {
  value: string;
  isCorrect: boolean | null;
  earnedPoints: number;
  feedback: QuizFeedbackStatus;
  meta?: Record<string, unknown>;
}

interface UseQuizParams {
  quiz: Quiz;
  autoStart?: boolean;
}

export function useQuiz({ quiz, autoStart = true }: UseQuizParams) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerRecord>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(
    quiz.timeLimit ?? null
  );

  const timerIntervalRef = useRef<number | null>(null);

  const maxScore = useMemo(
    () => quiz.questions.reduce((sum, q) => sum + q.points, 0),
    [quiz.questions]
  );

  const score = useMemo(
    () => Object.values(answers).reduce((sum, a) => sum + a.earnedPoints, 0),
    [answers]
  );

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const currentQuestion = useMemo(
    () => quiz.questions[currentQuestionIndex],
    [quiz.questions, currentQuestionIndex]
  );

  const isCompleted = endedAt !== null;

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setStartedAt(Date.now());
    setEndedAt(null);
    setIsReviewMode(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemainingSeconds(quiz.timeLimit ?? null);
  }, [quiz.timeLimit]);

  const complete = useCallback(() => {
    clearTimer();
    setEndedAt(Date.now());
    setIsReviewMode(true);
  }, [clearTimer]);

  useEffect(() => {
    if (!autoStart) return;
    start();
  }, [autoStart, start, quiz.id]);

  useEffect(() => {
    clearTimer();

    const timeLimit = quiz.timeLimit;
    if (!timeLimit) return;
    if (startedAt === null) return;
    if (isCompleted) return;

    timerIntervalRef.current = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(timeLimit - elapsedSeconds, 0);
      setTimeRemainingSeconds(remaining);
      if (remaining === 0) {
        complete();
      }
    }, 250);

    return () => {
      clearTimer();
    };
  }, [quiz.timeLimit, startedAt, isCompleted, complete, clearTimer]);

  const goNext = useCallback(() => {
    setCurrentQuestionIndex((i) => Math.min(i + 1, quiz.questions.length - 1));
  }, [quiz.questions.length]);

  const goPrevious = useCallback(() => {
    setCurrentQuestionIndex((i) => Math.max(i - 1, 0));
  }, []);

  const gradeNonCodeQuestion = useCallback(
    (question: QuizQuestion, value: string) => {
      if (question.type === 'multiple-choice') {
        const correct = question.options.find((o) => o.isCorrect);
        const isCorrect = correct ? correct.id === value : false;
        return {
          isCorrect,
          earnedPoints: isCorrect ? question.points : 0,
          feedback: (isCorrect ? 'correct' : 'incorrect') as QuizFeedbackStatus,
        };
      }

      if (question.type === 'true-false') {
        const isCorrect = question.correctAnswer === value;
        return {
          isCorrect,
          earnedPoints: isCorrect ? question.points : 0,
          feedback: (isCorrect ? 'correct' : 'incorrect') as QuizFeedbackStatus,
        };
      }

      return {
        isCorrect: null,
        earnedPoints: 0,
        feedback: null as QuizFeedbackStatus,
      };
    },
    []
  );

  const answerQuestion = useCallback(
    (questionId: string, value: string) => {
      if (isReviewMode || isCompleted) return;

      setAnswers((prev) => {
        if (prev[questionId]) return prev;
        const question = quiz.questions.find((q) => q.id === questionId);
        if (!question) return prev;

        if (question.type === 'code-challenge') {
          return {
            ...prev,
            [questionId]: {
              value,
              isCorrect: null,
              earnedPoints: 0,
              feedback: null,
            },
          };
        }

        const graded = gradeNonCodeQuestion(question, value);

        return {
          ...prev,
          [questionId]: {
            value,
            isCorrect: graded.isCorrect,
            earnedPoints: graded.earnedPoints,
            feedback: graded.feedback,
          },
        };
      });
    },
    [gradeNonCodeQuestion, isReviewMode, isCompleted, quiz.questions]
  );

  const setCodeDraft = useCallback(
    (questionId: string, code: string) => {
      if (isReviewMode || isCompleted) return;

      setAnswers((prev) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        if (!question || question.type !== 'code-challenge') return prev;

        const existing = prev[questionId];
        return {
          ...prev,
          [questionId]: {
            value: code,
            isCorrect: existing?.isCorrect ?? null,
            earnedPoints: existing?.earnedPoints ?? 0,
            feedback: existing?.feedback ?? null,
            meta: existing?.meta,
          },
        };
      });
    },
    [isReviewMode, isCompleted, quiz.questions]
  );

  const setCodeChallengeResult = useCallback(
    (
      questionId: string,
      params: {
        code: string;
        testResults: boolean[];
      }
    ) => {
      if (isReviewMode || isCompleted) return;

      setAnswers((prev) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        if (!question || question.type !== 'code-challenge') return prev;

        const allPassed = params.testResults.length
          ? params.testResults.every(Boolean)
          : false;

        return {
          ...prev,
          [questionId]: {
            value: params.code,
            isCorrect: allPassed,
            earnedPoints: allPassed ? question.points : 0,
            feedback: allPassed ? 'correct' : 'incorrect',
            meta: {
              testResults: params.testResults,
            },
          },
        };
      });
    },
    [isReviewMode, isCompleted, quiz.questions]
  );

  const restart = useCallback(() => {
    start();
  }, [start]);

  const enterReviewMode = useCallback(() => {
    if (!isCompleted) return;
    setIsReviewMode(true);
  }, [isCompleted]);

  const exitReviewMode = useCallback(() => {
    if (!isCompleted) return;
    setIsReviewMode(false);
  }, [isCompleted]);

  const canGoNext = currentQuestionIndex < quiz.questions.length - 1;
  const canGoPrevious = currentQuestionIndex > 0;

  return {
    quiz,
    currentQuestionIndex,
    currentQuestion,
    answers,
    answeredCount,
    score,
    maxScore,
    startedAt,
    endedAt,
    isCompleted,
    isReviewMode,
    timeRemainingSeconds,
    canGoNext,
    canGoPrevious,
    actions: {
      start,
      restart,
      complete,
      goNext,
      goPrevious,
      answerQuestion,
      setCodeDraft,
      setCodeChallengeResult,
      enterReviewMode,
      exitReviewMode,
      setCurrentQuestionIndex,
    },
  };
}

export type UseQuizReturn = ReturnType<typeof useQuiz>;
