// src/types/mobile.ts
export type Chapter = {
  id: string;
  title: string;
  duration: number; // in minutes
  progress: number; // 0-100
  type: 'video' | 'text' | 'quiz' | 'assignment';
  completed: boolean;
  content?: string;
  videoUrl?: string;
};

export type OfflineContent = {
  courseId: string;
  chapters: string[]; // chapter ids
  downloadedAt: Date;
  size: number; // in bytes
  lastAccessed: Date;
  checksum?: string;
};

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type TouchEventData = {
  x: number;
  y: number;
  timestamp: number;
  type: 'start' | 'move' | 'end';
  force?: number;
};

export type VideoControlState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  showControls: boolean;
  buffered: number;
};

export interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  duration: string; // in minutes or "4h 30m" format
  size: string; // e.g., "245 MB"
  totalLessons: number;
  progress: number;
  downloaded: boolean;
  downloadProgress?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  reviews: number;
  lastUpdated: Date;
  tags: string[];
  isDownloadable: boolean;
  requiresInternet?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  duration: string; // "12:30" format
  completed: boolean;
  videoUrl: string;
  order: number;
  description?: string;
  transcript?: string;
  resources?: string[];
  nextLessonId?: string;
  prevLessonId?: string;
}

export interface UserProgress {
  userId: string;
  streak: number;
  totalTimeSpent: number; // in minutes
  completedLessons: number;
  lastActive: Date;
  dailyGoal: number;
  weeklyGoal: number;
  achievements: Achievement[];
  level: number;
  xp: number;
}

export interface LearningSession {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  deviceInfo: DeviceInfo;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number;
  totalRequired: number;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  isOnline: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface DownloadProgress {
  courseId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  estimatedTime: number; // seconds
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}