import {
  useCourseProgressStore,
  InvalidProgressError,
  isValidLessonProgress,
} from './courseProgressStore';

describe('courseProgressStore', () => {
  beforeEach(() => {
    useCourseProgressStore.setState({ currentProgress: null });
  });
  describe('isValidLessonProgress Type Guard', () => {
    it('returns true for complete lesson data', () => {
      const validData = { lessonId: 'lesson-1', progress: 50 };
      expect(isValidLessonProgress(validData)).toBe(true);
    });
    it('returns false when required fields are missing', () => {
      expect(isValidLessonProgress({ lessonId: 'lesson-1' })).toBe(false); // missing progress
      expect(isValidLessonProgress({ progress: 50 })).toBe(false); // missing lessonId
      expect(isValidLessonProgress({})).toBe(false); // missing both
    });
  });
  describe('updateProgress', () => {
    it('successfully updates the store when given valid lesson data', () => {
      const store = useCourseProgressStore.getState();
      const validUpdate = { lessonId: 'lesson-123', progress: 100 };
      store.updateProgress(validUpdate);
      const updatedStore = useCourseProgressStore.getState();
      expect(updatedStore.currentProgress).toEqual(validUpdate);
    });
    it('throws InvalidProgressError when required fields are missing', () => {
      const store = useCourseProgressStore.getState();
      const invalidUpdate = { progress: 75 }; // missing lessonId
      expect(() => {
        store.updateProgress(invalidUpdate);
      }).toThrow(InvalidProgressError);
      expect(() => {
        store.updateProgress(invalidUpdate);
      }).toThrow('Update rejected: lessonData is missing required fields');
    });
    it('does not mutate the store state when an invalid update is rejected', () => {
      const store = useCourseProgressStore.getState();
      store.updateProgress({ lessonId: 'initial-lesson', progress: 0 });
      const stateBeforeError = useCourseProgressStore.getState().currentProgress;
      try {
        useCourseProgressStore.getState().updateProgress({ lessonId: 'new-lesson' }); // missing progress
      } catch (e) {}
      const stateAfterError = useCourseProgressStore.getState().currentProgress;
      expect(stateAfterError).toEqual(stateBeforeError);
    });
  });
});
