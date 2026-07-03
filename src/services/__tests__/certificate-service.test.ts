import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCourseCompletion,
  generateCertificate,
  CertificateServiceError,
} from '../certificate-service';

vi.mock('@/lib/db/pool', () => ({
  query: vi.fn(),
}));

describe('Certificate Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCourseCompletion', () => {
    it('should return progress data when course is completed (100% progress)', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [
          {
            user_id: 'user-123',
            course_id: 'course-456',
            progress: 100,
            completed_lessons: ['lesson-1', 'lesson-2', 'lesson-3'],
            last_accessed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
        ],
      } as any);

      const result = await validateCourseCompletion('user-123', 'course-456');

      expect(result).toEqual({
        userId: 'user-123',
        courseId: 'course-456',
        progress: 100,
        completedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
        lastAccessedAt: expect.any(String),
        completedAt: expect.any(String),
      });
    });

    it('should throw 403 error when course progress is below 100%', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [
          {
            user_id: 'user-123',
            course_id: 'course-456',
            progress: 75,
            completed_lessons: ['lesson-1', 'lesson-2'],
            last_accessed_at: new Date().toISOString(),
            completed_at: null,
          },
        ],
      } as any);

      await expect(validateCourseCompletion('user-123', 'course-456')).rejects.toThrow(
        CertificateServiceError
      );

      try {
        await validateCourseCompletion('user-123', 'course-456');
      } catch (error) {
        expect(error).toBeInstanceOf(CertificateServiceError);
        if (error instanceof CertificateServiceError) {
          expect(error.statusCode).toBe(403);
          expect(error.code).toBe('COURSE_NOT_COMPLETED');
          expect(error.message).toBe('Course not completed');
        }
      }
    });

    it('should throw 403 error when course progress is 0%', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [
          {
            user_id: 'user-123',
            course_id: 'course-456',
            progress: 0,
            completed_lessons: [],
            last_accessed_at: new Date().toISOString(),
            completed_at: null,
          },
        ],
      } as any);

      await expect(validateCourseCompletion('user-123', 'course-456')).rejects.toThrow(
        CertificateServiceError
      );

      try {
        await validateCourseCompletion('user-123', 'course-456');
      } catch (error) {
        expect(error).toBeInstanceOf(CertificateServiceError);
        if (error instanceof CertificateServiceError) {
          expect(error.statusCode).toBe(403);
          expect(error.code).toBe('COURSE_NOT_COMPLETED');
        }
      }
    });

    it('should throw 404 error when progress record not found', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [],
      } as any);

      await expect(validateCourseCompletion('user-123', 'course-456')).rejects.toThrow(
        CertificateServiceError
      );

      try {
        await validateCourseCompletion('user-123', 'course-456');
      } catch (error) {
        expect(error).toBeInstanceOf(CertificateServiceError);
        if (error instanceof CertificateServiceError) {
          expect(error.statusCode).toBe(404);
          expect(error.code).toBe('PROGRESS_NOT_FOUND');
          expect(error.message).toBe('Course progress not found');
        }
      }
    });

    it('should throw 500 error on database query failure', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockRejectedValue(new Error('Database connection failed'));

      await expect(validateCourseCompletion('user-123', 'course-456')).rejects.toThrow(
        CertificateServiceError
      );

      try {
        await validateCourseCompletion('user-123', 'course-456');
      } catch (error) {
        expect(error).toBeInstanceOf(CertificateServiceError);
        if (error instanceof CertificateServiceError) {
          expect(error.statusCode).toBe(500);
          expect(error.code).toBe('VALIDATION_ERROR');
        }
      }
    });
  });

  describe('generateCertificate', () => {
    it('should generate certificate when course is completed', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [
          {
            user_id: 'user-123',
            course_id: 'course-456',
            progress: 100,
            completed_lessons: ['lesson-1', 'lesson-2', 'lesson-3'],
            last_accessed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
        ],
      } as any);

      const certificateData = {
        userId: 'user-123',
        courseId: 'course-456',
        userName: 'John Doe',
        courseTitle: 'Introduction to Programming',
        completionDate: new Date().toISOString(),
      };

      const result = await generateCertificate(certificateData);

      expect(result).toEqual({
        ...certificateData,
        completionDate: expect.any(String),
      });
    });

    it('should throw error when course is not completed', async () => {
      const { query } = await import('@/lib/db/pool');
      vi.mocked(query).mockResolvedValue({
        rows: [
          {
            user_id: 'user-123',
            course_id: 'course-456',
            progress: 50,
            completed_lessons: ['lesson-1'],
            last_accessed_at: new Date().toISOString(),
            completed_at: null,
          },
        ],
      } as any);

      const certificateData = {
        userId: 'user-123',
        courseId: 'course-456',
        userName: 'John Doe',
        courseTitle: 'Introduction to Programming',
        completionDate: new Date().toISOString(),
      };

      await expect(generateCertificate(certificateData)).rejects.toThrow(CertificateServiceError);
    });
  });
});
