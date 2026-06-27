import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CMSCourse, MediaUploadTask, ContentTemplate } from '../types/cms';

interface CMSState {
  course: CMSCourse;
  history: CMSCourse[];
  historyIndex: number;
  mediaQueue: MediaUploadTask[];
  templates: ContentTemplate[];
  isSaving: boolean;

  // Actions
  setCourse: (course: CMSCourse) => void;
  updateCourse: (updates: Partial<CMSCourse>) => void;
  undo: () => void;
  redo: () => void;

  // Media Actions
  addToQueue: (tasks: MediaUploadTask[]) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  setUploadStatus: (
    id: string,
    status: MediaUploadTask['status'],
    url?: string,
    error?: string,
  ) => void;

  // Template Actions
  setTemplates: (templates: ContentTemplate[]) => void;
}

export const useCMSStore = create<CMSState>()(
  persist(
    (set) => ({
      course: {
        id: '',
        title: '',
        description: '',
        modules: [],
      },
      history: [],
      historyIndex: -1,
      mediaQueue: [],
      templates: [],
      isSaving: false,

      setCourse: (course) => {
        set((state) => {
          let newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(course);
          
          if (newHistory.length > 20) {
            newHistory = newHistory.slice(newHistory.length - 20);
          }
          
          return {
            course,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      updateCourse: (updates) => {
        set((state) => {
          const updatedCourse = { ...state.course, ...updates };
          let newHistory = state.history.slice(0, state.historyIndex + 1);

          newHistory.push(updatedCourse);
          
          if (newHistory.length > 20) {
            newHistory = newHistory.slice(newHistory.length - 20);
          }

          return {
            course: updatedCourse,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            const prevIndex = state.historyIndex - 1;
            return {
              course: state.history[prevIndex],
              historyIndex: prevIndex,
            };
          }
          return state;
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            const nextIndex = state.historyIndex + 1;
            return {
              course: state.history[nextIndex],
              historyIndex: nextIndex,
            };
          }
          return state;
        });
      },

      addToQueue: (tasks) => {
        set((state) => ({
          mediaQueue: [...state.mediaQueue, ...tasks],
        }));
      },

      updateUploadProgress: (id, progress) => {
        set((state) => ({
          mediaQueue: state.mediaQueue.map((task) => (task.id === id ? { ...task, progress } : task)),
        }));
      },

      setUploadStatus: (id, status, url, error) => {
        set((state) => ({
          mediaQueue: state.mediaQueue.map((task) =>
            task.id === id ? { ...task, status, url, error } : task,
          ),
        }));
      },

      setTemplates: (templates) => {
        set({ templates });
      },
    }),
    {
      name: 'cms-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        course: state.course,
        history: state.history,
        historyIndex: state.historyIndex,
      }),
    }
  )
);
