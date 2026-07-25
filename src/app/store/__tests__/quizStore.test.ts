import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuizStore, getCompletedQuizzes } from '../quizStore';
import type { Quiz } from '../quizStore';

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'A test quiz',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'Q1?',
      options: [{ id: 'a1', text: 'A', isCorrect: true }],
      points: 1,
    },
    { id: 'q2', type: 'true-false', text: 'Q2?', points: 1 },
  ],
};

function resetStore() {
  sessionStorage.clear();
  useQuizStore.persist.clearStorage();
  useQuizStore.setState({
    currentQuiz: null,
    currentQuestionIndex: 0,
    answers: {},
    isReviewMode: false,
    startTime: null,
    endTime: null,
  });
}

describe('quizStore persist middleware', () => {
  beforeEach(resetStore);

  it('persists currentQuiz, currentQuestionIndex, answers, startTime, and isReviewMode to sessionStorage', () => {
    vi.useFakeTimers();
    useQuizStore.getState().setCurrentQuiz(mockQuiz);
    useQuizStore.getState().startQuiz();
    useQuizStore.getState().setAnswer('q1', 'A');
    useQuizStore.getState().nextQuestion();

    const stored = JSON.parse(sessionStorage.getItem('teachlink-quiz-storage') || '{}');
    expect(stored.state).toBeDefined();
    expect(stored.state.currentQuiz).toEqual(mockQuiz);
    expect(stored.state.currentQuestionIndex).toBe(1);
    expect(stored.state.answers).toEqual({ q1: 'A' });
    expect(stored.state.startTime).toBeDefined();
    expect(stored.state.isReviewMode).toBe(false);
    vi.useRealTimers();
  });

  it('rehydrates correctly and resumes quiz after simulated refresh', async () => {
    useQuizStore.getState().setCurrentQuiz(mockQuiz);
    useQuizStore.getState().startQuiz();
    useQuizStore.getState().setAnswer('q1', 'A');
    useQuizStore.getState().nextQuestion();

    const persistedData = sessionStorage.getItem('teachlink-quiz-storage');

    resetStore();

    sessionStorage.setItem('teachlink-quiz-storage', persistedData!);

    await useQuizStore.persist.rehydrate();

    const stateAfter = useQuizStore.getState();
    expect(stateAfter.currentQuiz).toEqual(mockQuiz);
    expect(stateAfter.currentQuestionIndex).toBe(1);
    expect(stateAfter.answers).toEqual({ q1: 'A' });
    expect(stateAfter.startTime).toBeInstanceOf(Date);
  });

  it('clears sessionStorage and saves history on endQuiz', () => {
    useQuizStore.getState().setCurrentQuiz(mockQuiz);
    useQuizStore.getState().startQuiz();
    useQuizStore.getState().setAnswer('q1', 'A');
    useQuizStore.getState().setAnswer('q2', 'true');

    useQuizStore.getState().endQuiz();

    const stored = sessionStorage.getItem('teachlink-quiz-storage');
    expect(stored).toBeNull();

    const history = getCompletedQuizzes();
    expect(history).toHaveLength(1);
    expect(history[0].quizId).toBe('quiz-1');
    expect(history[0].answers).toEqual({ q1: 'A', q2: 'true' });
  });

  it('resets quiz state and clears persisted data on resetQuiz', () => {
    useQuizStore.getState().setCurrentQuiz(mockQuiz);
    useQuizStore.getState().startQuiz();
    useQuizStore.getState().setAnswer('q1', 'A');

    useQuizStore.getState().resetQuiz();

    const state = useQuizStore.getState();
    expect(state.currentQuiz).toBeNull();
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.startTime).toBeNull();
    expect(state.isReviewMode).toBe(false);
    expect(state.endTime).toBeNull();
  });

  it('does not overwrite startTime on re-request if already set', () => {
    useQuizStore.getState().setCurrentQuiz(mockQuiz);
    useQuizStore.getState().startQuiz();
    const originalStartTime = useQuizStore.getState().startTime;

    useQuizStore.getState().startQuiz();

    expect(useQuizStore.getState().startTime).toBe(originalStartTime);
  });
});
