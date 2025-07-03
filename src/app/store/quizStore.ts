import { create } from 'zustand';

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

const initialState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: {},
  isReviewMode: false,
  startTime: null,
  endTime: null,
};

export const useQuizStore = create<QuizState>((set, get) => ({
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
        (state.currentQuiz?.questions.length || 1) - 1
      ),
    })),

  previousQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  startQuiz: () => set({ startTime: new Date() }),

  endQuiz: () => set({ endTime: new Date() }),

  toggleReviewMode: () =>
    set((state) => ({ isReviewMode: !state.isReviewMode })),

  resetQuiz: () => set(initialState),
})); 