import { create } from 'zustand';

export interface LessonProgress {
  lessonId: string;
  progress: number;
  lastAccessed?: number; // Optional field example
}
interface CourseProgressState {
  currentProgress: LessonProgress | null;
  updateProgress: (lessonData: Partial<LessonProgress>) => void;
}
export class InvalidProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProgressError';
  }
}
export function isValidLessonProgress(data: Partial<LessonProgress>): data is LessonProgress {
  return (
    typeof data.lessonId === 'string' &&
    data.lessonId.trim() !== '' &&
    typeof data.progress === 'number'
  );
}
export const useCourseProgressStore = create<CourseProgressState>((set) => ({
  currentProgress: null,
  updateProgress: (lessonData: Partial<LessonProgress>) => {
    // Apply the type guard before the spread operation
    if (!isValidLessonProgress(lessonData)) {
      throw new InvalidProgressError(
        'Update rejected: lessonData is missing required fields (lessonId or progress).',
      );
    }
    set((state) => ({
      currentProgress: {
        ...state.currentProgress,
        ...lessonData,
      },
    }));
  },
}));
