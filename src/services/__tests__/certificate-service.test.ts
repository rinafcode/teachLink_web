import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCourseCompletion,
  generateCertificate,
  getCertificateAnalytics,
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

// ─────────────────────────────────────────────────────────────────────────────
// getCertificateAnalytics — unit tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The certificate-service uses an in-memory Map that persists across tests
 * within the same module, so we use unique userIds per describe block to keep
 * counts deterministic.
 *
 * generateCertificate calls getCourseCompletion which queries the DB — we set
 * the already-hoisted vi.mock (defined at the top of this file) to always
 * return a 100%-complete row so the analytics setup succeeds.
 */

describe('getCertificateAnalytics', () => {
  beforeEach(async () => {
    // Make the DB always return a completed course row so generateCertificate
    // succeeds in every analytics test.
    const { query } = await import('@/lib/db/pool');
    vi.mocked(query).mockResolvedValue({
      rows: [
        {
          user_id: 'analytics-user',
          course_id: 'course-123',
          progress: 100,
          completed_lessons: [],
          last_accessed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      ],
    } as any);
  });
  // Each test group uses a unique userId to avoid cross-test contamination
  // from the shared in-memory store.

  it('returns zero counts when no certificates exist for the user', () => {
    const result = getCertificateAnalytics('no-certs-user-999');

    expect(result.totalIssued).toBe(0);
    expect(result.totalActive).toBe(0);
    expect(result.totalRevoked).toBe(0);
    expect(result.issuedByCourse).toHaveLength(0);
    expect(result.avgCompletionToIssuanceDays).toBe(0);
  });

  it('returns a 30-element issuedByDay array with today always present', () => {
    const result = getCertificateAnalytics('no-certs-user-999');

    expect(result.issuedByDay).toHaveLength(30);

    const today = new Date().toISOString().slice(0, 10);
    const todayBucket = result.issuedByDay.find((b) => b.date === today);
    expect(todayBucket).toBeDefined();
  });

  it('issuedByDay dates are sorted in ascending chronological order', () => {
    const result = getCertificateAnalytics('no-certs-user-999');

    const dates = result.issuedByDay.map((b) => b.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('counts active certificates correctly after generation', async () => {
    const userId = 'analytics-count-user-001';

    // Issue two certificates for the same user
    await generateCertificate(userId, { courseId: 'course-123', name: 'Alice' });
    await generateCertificate(userId, { courseId: 'course-123', name: 'Alice' });

    const result = getCertificateAnalytics(userId);

    expect(result.totalIssued).toBe(2);
    expect(result.totalActive).toBe(2);
    expect(result.totalRevoked).toBe(0);
  });

  it('reflects revoked certificates in the counts', async () => {
    const { revokeCertificate } = await import('../certificate-service');
    const userId = 'analytics-revoke-user-002';

    const cert1 = await generateCertificate(userId, { courseId: 'course-123', name: 'Bob' });
    const cert2 = await generateCertificate(userId, { courseId: 'course-123', name: 'Bob' });

    expect(cert1).not.toBeNull();
    expect(cert2).not.toBeNull();

    await revokeCertificate(cert1!.certificateId);

    const result = getCertificateAnalytics(userId);

    expect(result.totalIssued).toBe(2);
    expect(result.totalActive).toBe(1);
    expect(result.totalRevoked).toBe(1);
  });

  it('builds issuedByCourse sorted by count descending', async () => {
    // We cannot query real course names for arbitrary UUIDs (getCourseById is
    // mocked to only know 'course-123'), so we issue multiple certs for the
    // same course and verify the shape is correct.
    const userId = 'analytics-course-user-003';

    await generateCertificate(userId, { courseId: 'course-123', name: 'Carol' });
    await generateCertificate(userId, { courseId: 'course-123', name: 'Carol' });
    await generateCertificate(userId, { courseId: 'course-123', name: 'Carol' });

    const result = getCertificateAnalytics(userId);

    expect(result.issuedByCourse.length).toBeGreaterThan(0);
    // Each entry must have the expected shape
    result.issuedByCourse.forEach((entry) => {
      expect(entry).toHaveProperty('courseName');
      expect(typeof entry.courseName).toBe('string');
      expect(entry).toHaveProperty('count');
      expect(typeof entry.count).toBe('number');
      expect(entry.count).toBeGreaterThan(0);
    });
    // Should be sorted descending
    for (let i = 0; i < result.issuedByCourse.length - 1; i++) {
      expect(result.issuedByCourse[i].count).toBeGreaterThanOrEqual(
        result.issuedByCourse[i + 1].count,
      );
    }
  });

  it('scopes results to the given userId only', async () => {
    const userA = 'analytics-scope-user-A';
    const userB = 'analytics-scope-user-B';

    await generateCertificate(userA, { courseId: 'course-123', name: 'Dave' });
    await generateCertificate(userA, { courseId: 'course-123', name: 'Dave' });
    await generateCertificate(userB, { courseId: 'course-123', name: 'Eve' });

    const resultA = getCertificateAnalytics(userA);
    const resultB = getCertificateAnalytics(userB);

    expect(resultA.totalIssued).toBe(2);
    expect(resultB.totalIssued).toBe(1);
  });

  it('returns aggregate across all users when no userId is given', async () => {
    // Issue certs for two distinct users
    const userC = 'analytics-global-user-C';
    const userD = 'analytics-global-user-D';

    await generateCertificate(userC, { courseId: 'course-123', name: 'Frank' });
    await generateCertificate(userD, { courseId: 'course-123', name: 'Grace' });

    // Global call — no userId filter
    const global = getCertificateAnalytics();

    // Must include certs from BOTH users (plus any from previous tests)
    expect(global.totalIssued).toBeGreaterThanOrEqual(2);
  });

  it('avgCompletionToIssuanceDays is a non-negative finite number', async () => {
    const userId = 'analytics-latency-user-004';

    await generateCertificate(userId, { courseId: 'course-123', name: 'Heidi' });

    const result = getCertificateAnalytics(userId);

    expect(result.avgCompletionToIssuanceDays).toBeGreaterThanOrEqual(0);
    expect(isFinite(result.avgCompletionToIssuanceDays)).toBe(true);
  });

  it('today issuance bucket count increments after certificate generation', async () => {
    const userId = 'analytics-bucket-user-005';
    const today = new Date().toISOString().slice(0, 10);

    const before = getCertificateAnalytics(userId);
    const beforeCount = before.issuedByDay.find((b) => b.date === today)?.count ?? 0;

    await generateCertificate(userId, { courseId: 'course-123', name: 'Ivan' });

    const after = getCertificateAnalytics(userId);
    const afterCount = after.issuedByDay.find((b) => b.date === today)?.count ?? 0;

    expect(afterCount).toBe(beforeCount + 1);
  });
});
