import { query } from '@/lib/db/pool';
import type { CourseProgress } from '@/schemas/progress.schema';

/**
 * Certificate Service
 * Handles certificate generation with course completion validation
 */

export interface CertificateData {
  userId: string;
  courseId: string;
  userName: string;
  courseTitle: string;
  completionDate: string;
}

export class CertificateServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'CERTIFICATE_ERROR'
  ) {
    super(message);
    this.name = 'CertificateServiceError';
  }
}

/**
 * Validates that a user has completed a course by checking their progress
 * @param userId - The user's ID
 * @param courseId - The course's ID
 * @returns The course progress data if found
 * @throws CertificateServiceError with 403 if course is not completed
 * @throws CertificateServiceError with 404 if progress record not found
 */
export async function validateCourseCompletion(
  userId: string,
  courseId: string
): Promise<CourseProgress> {
  try {
    // Query the user_progress table for the requesting user and target course
    const result = await query(
      `SELECT user_id, course_id, progress, completed_lessons, last_accessed_at, completed_at
       FROM user_progress
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      throw new CertificateServiceError(
        'Course progress not found',
        404,
        'PROGRESS_NOT_FOUND'
      );
    }

    const row = result.rows[0] as {
      user_id: string;
      course_id: string;
      progress: number;
      completed_lessons: string[];
      last_accessed_at: string;
      completed_at: string | undefined;
    };

    const progress: CourseProgress = {
      userId: row.user_id,
      courseId: row.course_id,
      progress: row.progress,
      completedLessons: row.completed_lessons,
      lastAccessedAt: row.last_accessed_at,
      completedAt: row.completed_at ?? undefined,
    };

    // Assert that progress >= 100 before generating the certificate
    if (progress.progress < 100) {
      throw new CertificateServiceError(
        'Course not completed',
        403,
        'COURSE_NOT_COMPLETED'
      );
    }

    return progress;
  } catch (error) {
    if (error instanceof CertificateServiceError) {
      throw error;
    }
    throw new CertificateServiceError(
      'Failed to validate course completion',
      500,
      'VALIDATION_ERROR'
    );
  }
}

/**
 * Generates a certificate for a completed course
 * @param certificateData - The certificate data
 * @returns The generated certificate data
 * @throws CertificateServiceError if validation fails
 */
export async function generateCertificate(
  certificateData: CertificateData
): Promise<CertificateData> {
  // Validate course completion before generating certificate
  await validateCourseCompletion(certificateData.userId, certificateData.courseId);

  // In a real implementation, this would generate a PDF certificate
  // For now, we return the certificate data
  return {
    ...certificateData,
    completionDate: new Date().toISOString(),
  };
}
