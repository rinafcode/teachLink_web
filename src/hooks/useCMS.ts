import { useCallback } from 'react';
import { useCMSStore } from '../store/cmsStore';
import { CMSCourse, CMSModule, CMSLesson } from '../types/cms';

export const useCMS = () => {
  const store = useCMSStore();

  const addModule = useCallback(() => {
    const newModule: CMSModule = {
      id: `module-${Date.now()}`,
      title: 'New Module',
      lessons: [],
      order: store.course.modules.length,
    };
    store.updateCourse({
      modules: [...store.course.modules, newModule],
    });
  }, [store]);

  const addLesson = useCallback(
    (moduleId: string) => {
      const newLesson: CMSLesson = {
        id: `lesson-${Date.now()}`,
        title: 'New Lesson',
        type: 'article',
        content: '',
        order: 0, // Will be updated by reorder logic
      };

      const updatedModules = store.course.modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: [...m.lessons, { ...newLesson, order: m.lessons.length }],
          };
        }
        return m;
      });

      store.updateCourse({ modules: updatedModules });
    },
    [store],
  );

  const updateLessonContent = useCallback(
    (moduleId: string, lessonId: string, content: string) => {
      const updatedModules = store.course.modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, content } : l)),
          };
        }
        return m;
      });
      store.updateCourse({ modules: updatedModules });
    },
    [store],
  );

  const canUndo = store.historyIndex > 0;
  const canRedo = store.historyIndex < store.history.length - 1;

  return {
    ...store,
    addModule,
    addLesson,
    updateLessonContent,
    canUndo,
    canRedo,
  };
};
