import { apiClient } from '@/lib/api';
import { Course, Lesson, UserProgress, LearningSession } from '../types/mobile';

const BASE = '/api';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const apiService = {
  getCourses: (params?: { page?: number; limit?: number; category?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient.get<PaginatedResponse<Course>>(`${BASE}/courses?${query}`);
  },

  getCourse: (id: string) => apiClient.get<ApiResponse<Course>>(`${BASE}/courses/${id}`),

  getCourseLessons: (courseId: string) =>
    apiClient.get<ApiResponse<Lesson[]>>(`${BASE}/courses/${courseId}/lessons`),

  getUserProgress: () => apiClient.get<ApiResponse<UserProgress>>(`${BASE}/user/progress`),

  updateLessonProgress: (lessonId: string, completed: boolean) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/lessons/${lessonId}/progress`, { completed }),

  getDownloadableCourses: () =>
    apiClient.get<ApiResponse<Course[]>>(`${BASE}/courses/downloadable`),

  downloadCourse: (courseId: string) =>
    apiClient.get<ApiResponse<{ downloadUrl: string; size: number }>>(
      `${BASE}/courses/${courseId}/download`,
    ),

  deleteDownloadedCourse: (courseId: string) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/courses/${courseId}/offline`),

  startLearningSession: (lessonId: string) =>
    apiClient.post<ApiResponse<LearningSession>>(`${BASE}/sessions`, { lessonId }),

  endLearningSession: (sessionId: string) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/sessions/${sessionId}`, {}),
};
