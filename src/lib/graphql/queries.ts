import type { GraphQLQueryConfig } from './types';

// Query builders intentionally include only fields required by UI callers.
export const lessonSummaryQuery = (lessonId: string): GraphQLQueryConfig => ({
  operationName: 'LessonSummary',
  rootField: 'lesson',
  variables: { id: lessonId },
  variableTypes: { id: 'ID!' },
  selection: {
    id: true,
    title: true,
    duration: true,
    progressPercent: true,
    instructor: {
      fields: {
        id: true,
        displayName: true,
      },
    },
  },
});

export const courseCardQuery = (courseId: string): GraphQLQueryConfig => ({
  operationName: 'CourseCard',
  rootField: 'course',
  variables: { id: courseId },
  variableTypes: { id: 'ID!' },
  selection: {
    id: true,
    title: true,
    slug: true,
    thumbnailUrl: true,
    rating: true,
    lessonCount: true,
  },
});
