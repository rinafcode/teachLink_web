/**
 * Query key factory — provides consistent, type-safe cache keys for all API calls.
 * Use these as the first argument to any data-fetching hook or cache invalidation call.
 */
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    list: (params?: { cursor?: string; limit?: number }) => ['courses', 'list', params] as const,
    detail: (id: string) => ['courses', id] as const,
    lessons: (courseId: string) => ['courses', courseId, 'lessons'] as const,
  },
  user: {
    all: ['user'] as const,
    progress: () => ['user', 'progress'] as const,
  },
  search: {
    all: ['search'] as const,
    results: (query: string) => ['search', query] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
    byLesson: (lessonId: string) => ['bookmarks', lessonId] as const,
  },
  notes: {
    all: ['notes'] as const,
    byLesson: (lessonId: string) => ['notes', lessonId] as const,
  },
} as const;
