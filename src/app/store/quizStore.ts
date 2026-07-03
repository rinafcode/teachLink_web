import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'code-challenge';
  text: string;
  options?: Option[];
  correctAnswer?: string;
  codeTemplate?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
  }[];
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit?: number;
  questions: Question[];
}

export interface CompletedQuiz {
  quizId: string;
  title: string;
  answers: Record<string, string>;
  startTime: string;
  endTime: string;
}

interface QuizState {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isReviewMode: boolean;
  startTime: Date | null;
  endTime: Date | null;
  setCurrentQuiz: (quiz: Quiz) => void;
  setAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  startQuiz: () => void;
  endQuiz: () => void;
  toggleReviewMode: () => void;
  resetQuiz: () => void;
}

const QUIZ_HISTORY_KEY = 'teachlink-quiz-history';

const initialState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: {},
  isReviewMode: false,
  startTime: null,
  endTime: null,
};

export function getCompletedQuizzes(): CompletedQuiz[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        })),

      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.min(
            state.currentQuestionIndex + 1,
            (state.currentQuiz?.questions.length || 1) - 1,
          ),
        })),

      previousQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
        })),

      startQuiz: () =>
        set((state) => {
          if (state.startTime) return {};
          return { startTime: new Date() };
        }),

      endQuiz: () => {
        const state = get();
        const endTime = new Date();

        if (state.currentQuiz) {
          try {
            const history: CompletedQuiz[] = JSON.parse(
              localStorage.getItem(QUIZ_HISTORY_KEY) || '[]',
            );
            history.push({
              quizId: state.currentQuiz.id,
              title: state.currentQuiz.title,
              answers: state.answers,
              startTime: state.startTime?.toISOString() ?? '',
              endTime: endTime.toISOString(),
            });
            localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
          } catch {
            // localStorage unavailable
          }
        }

        set({ endTime });
        useQuizStore.persist.clearStorage();
      },

      toggleReviewMode: () => set((state) => ({ isReviewMode: !state.isReviewMode })),

      resetQuiz: () => set(initialState),
    }),
    {
      name: 'teachlink-quiz-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentQuiz: state.currentQuiz,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        startTime: state.startTime,
        isReviewMode: state.isReviewMode,
      }),
      merge: (persisted, current) => {
        const data = persisted as Partial<QuizState>;
        return {
          ...current,
          ...data,
          startTime: data.startTime ? new Date(data.startTime as unknown as string) : null,
        };
      },
    },
  ),
);
