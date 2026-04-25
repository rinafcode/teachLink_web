/**
 * Shared API response envelope and domain types.
 * Import these as generics when calling apiClient methods to get full type safety.
 */

// ---------------------------------------------------------------------------
// Envelope types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  totalLessons: number;
  progress: number;
  size: string;
  thumbnailUrl: string;
  downloaded: boolean;
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

export interface VideoBookmark {
  id: string;
  time: number;
  title: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface VideoNote {
  id: string;
  time: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// User progress
// ---------------------------------------------------------------------------

export interface UserProgress {
  streak: number;
  totalTimeSpent: number;
  dailyGoal: number;
  lastActive: string;
  completedCourses: number;
  totalCourses: number;
}

// ---------------------------------------------------------------------------
// Video analytics
// ---------------------------------------------------------------------------

export interface AnalyticsEventPayload {
  userId?: string;
  lessonId: string;
  eventType: string;
  payload: Record<string, unknown>;
}
