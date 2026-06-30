import { User as ZodUser, UserRole as ZodUserRole } from '@/schemas/user.schema';
import { Course as ZodCourse } from '@/schemas/course.schema';
import { AuthResponse as ZodAuthResponse } from '@/schemas/auth.schema';
import { AnalyticsEventPayload as ZodAnalyticsEventPayload } from '@/schemas/analytics.schema';
import { UserProgress as ZodUserProgress } from '@/schemas/progress.schema';
import {
  VideoBookmark as ZodVideoBookmark,
  VideoNote as ZodVideoNote,
} from '@/schemas/content.schema';

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
  nextCursor?: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type UserRole = ZodUserRole;
export const UserRole = {
  ADMIN: 'ADMIN' as UserRole,
  INSTRUCTOR: 'INSTRUCTOR' as UserRole,
  STUDENT: 'STUDENT' as UserRole,
  GUEST: 'GUEST' as UserRole,
};

export enum Permission {
  // Course Permissions
  COURSE_VIEW = 'COURSE_VIEW',
  COURSE_CREATE = 'COURSE_CREATE',
  COURSE_EDIT = 'COURSE_EDIT',
  COURSE_DELETE = 'COURSE_DELETE',
  COURSE_DOWNLOAD = 'COURSE_DOWNLOAD',

  // User Permissions
  USER_VIEW = 'USER_VIEW',
  USER_MANAGE = 'USER_MANAGE',

  // Content Permissions
  CONTENT_ACCESS = 'CONTENT_ACCESS',
  CONTENT_UPLOAD = 'CONTENT_UPLOAD',
  CONTENT_APPROVE = 'CONTENT_APPROVE',

  // System Permissions
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  ANALYTICS_VIEW = 'ANALYTICS_VIEW',
}

export type User = ZodUser;
export type AuthResponse = ZodAuthResponse;

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export type Course = ZodCourse;

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

export type VideoBookmark = ZodVideoBookmark;

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export type VideoNote = ZodVideoNote;

// ---------------------------------------------------------------------------
// User progress
// ---------------------------------------------------------------------------

export type UserProgress = ZodUserProgress;

// ---------------------------------------------------------------------------
// Video analytics
// ---------------------------------------------------------------------------

export type AnalyticsEventPayload = ZodAnalyticsEventPayload;

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

import type { ApprovalStatus, ReviewDecision } from './approvals';

export type { ApprovalStatus, ReviewDecision } from './approvals';

export interface ApprovalItem {
  id: string;
  contentId: string;
  contentType: 'COURSE' | 'POST';
  title: string;
  submittedBy: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface SubmitApprovalRequest {
  contentId: string;
  contentType: ApprovalItem['contentType'];
  title: string;
}

export interface ReviewApprovalRequest {
  status: ReviewDecision;
  reviewNote?: string;
}
