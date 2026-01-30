import { Course, Lesson, UserProgress, OfflineContent, LearningSession } from '../types/mobile';

const API_BASE_URL = '/api';

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

class ApiService {
  private headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
  };

  // Courses
  async getCourses(params?: { page?: number; limit?: number; category?: string }): Promise<PaginatedResponse<Course>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetch(`${API_BASE_URL}/courses?${query}`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
  }

  async getCourse(id: string): Promise<ApiResponse<Course>> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to fetch course');
    return response.json();
  }

  async getCourseLessons(courseId: string): Promise<ApiResponse<Lesson[]>> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to fetch lessons');
    return response.json();
  }

  // User Progress
  async getUserProgress(): Promise<ApiResponse<UserProgress>> {
    const response = await fetch(`${API_BASE_URL}/user/progress`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to fetch progress');
    return response.json();
  }

  async updateLessonProgress(lessonId: string, completed: boolean): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ completed })
    });
    
    if (!response.ok) throw new Error('Failed to update progress');
    return response.json();
  }

  // Offline Content
  async getDownloadableCourses(): Promise<ApiResponse<Course[]>> {
    const response = await fetch(`${API_BASE_URL}/courses/downloadable`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to fetch downloadable courses');
    return response.json();
  }

  async downloadCourse(courseId: string): Promise<ApiResponse<{ downloadUrl: string; size: number }>> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/download`, {
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to initiate download');
    return response.json();
  }

  async deleteDownloadedCourse(courseId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/offline`, {
      method: 'DELETE',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to delete downloaded course');
    return response.json();
  }

  // Learning Session
  async startLearningSession(lessonId: string): Promise<ApiResponse<LearningSession>> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ lessonId })
    });
    
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  }

  async endLearningSession(sessionId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: this.headers
    });
    
    if (!response.ok) throw new Error('Failed to end session');
    return response.json();
  }
}

export const apiService = new ApiService();