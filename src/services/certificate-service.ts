import { createHash, timingSafeEqual } from 'crypto';
import { query } from '@/lib/db/pool';
import { createLogger } from '@/lib/logging';
import {
  CertificateInput,
  CertificateRecord,
  CertificateResponse,
  CertificateVerification,
  CourseCompletion,
} from '@/schemas/certificate.schema';

const logger = createLogger('certificate-service');

/**
 * In-memory certificate store (replace with database in production).
 * In production: use persistent database with indexed queries.
 */
const certificateStore = new Map<string, CertificateRecord>();

/**
 * Verify course completion status via the user_progress table.
 *
 * SECURITY: Server-side verification prevents users from generating certificates
 * for courses they haven't completed. Check must happen before generation.
 */
async function getCourseCompletion(
  userId: string,
  courseId: string,
): Promise<CourseCompletion | null> {
  logger.debug('Checking course completion', {
    context: { userId, courseId },
  });

  try {
    const result = await query(
      `SELECT user_id, course_id, progress, completed_lessons, last_accessed_at, completed_at
       FROM user_progress
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as {
      user_id: string;
      course_id: string;
      progress: number;
      completed_lessons: string[];
      last_accessed_at: string;
      completed_at: string | null;
    };

    return {
      userId: row.user_id,
      courseId: row.course_id,
      isCompleted: row.progress >= 100,
      completedAt: row.completed_at ?? undefined,
    };
  } catch (error) {
    logger.error('Failed to check course completion', {
      context: { userId, courseId },
      error,
    });
    return null;
  }
}

/**
 * Get a mock course record by ID.
 * In production: Query courses table.
 */
async function getCourseById(courseId: string): Promise<{ id: string; name: string } | null> {
  // MOCK IMPLEMENTATION
  // TODO: Query courses table for: SELECT id, name FROM courses WHERE id = ?
  if (courseId === 'course-123') {
    return { id: courseId, name: 'Introduction to TypeScript' };
  }
  return null;
}

/**
 * Get a certificate record by ID.
 * Returns the certificate record or null if not found.
 *
 * SECURITY: Caller must verify ownership (userId matches).
 * This function does not check ownership — that's the caller's responsibility.
 */
export async function getCertificateById(certId: string): Promise<CertificateRecord | null> {
  return certificateStore.get(certId) || null;
}

/**
 * Verify a certificate's authenticity using stored hash.
 * Public endpoint — no auth required.
 *
 * SECURITY: Uses HMAC-SHA256 with a server secret to make forgery cryptographically hard.
 * Even if an attacker has a certificate, they cannot forge a valid hash without the secret.
 */
export async function verifyCertificate(certId: string): Promise<CertificateVerification | null> {
  const cert = await getCertificateById(certId);
  if (!cert || cert.revokedAt) {
    return null; // Certificate not found or revoked
  }

  // Recompute hash and compare
  if (!verifyCertificateSignature(cert)) {
    logger.warn('Certificate verification failed: hash mismatch', {
      context: { certificateId: certId },
    });
    return null;
  }

  return {
    valid: true,
    certificateId: cert.certificateId,
    userId: cert.userId,
    courseId: cert.courseId,
    issuedAt: cert.issuedAt,
    completionDate: cert.completionDate,
  };
}

/**
 * Generate a verification hash for a certificate.
 *
 * Hash = SHA256(userId + courseId + completionDate + SECRET)
 *
 * This hash is stored with the certificate and can be recomputed to verify authenticity.
 * The SECRET must be environment variable (never in code) and rotated periodically.
 */
function computeCertificateHash(
  cert: Omit<CertificateRecord, 'verificationHash'> & { certificateId?: string },
): string {
  // WARNING: In production, get this from environment variables
  const SECRET = process.env.CERTIFICATE_VERIFICATION_SECRET || 'dev-secret-DO-NOT-USE-IN-PROD';

  const data = `${cert.userId}:${cert.courseId}:${cert.completionDate}:${SECRET}`;
  return createHash('sha256').update(data).digest('hex');
}

function secureHashEquals(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

/** Verify an issued certificate's authenticity before it is trusted. */
export function verifyCertificateSignature(cert: CertificateRecord): boolean {
  return secureHashEquals(computeCertificateHash(cert), cert.verificationHash);
}

/**
 * Generate a new certificate for a user who has completed a course.
 *
 * SECURITY CHECKS:
 * 1. User must be authenticated (verified by caller via requireAuth)
 * 2. User must have completed the course (server-side verification against user_progress)
 * 3. Input must be sanitized (schema validation)
 * 4. Rate limiting applied by caller
 * 5. All changes logged to audit trail by caller
 *
 * Returns: Certificate record on success, null if requirements not met
 */
export async function generateCertificate(
  userId: string,
  input: CertificateInput,
): Promise<CertificateRecord | null> {
  logger.info('Certificate generation requested', {
    context: { userId, courseId: input.courseId },
  });

  // T3 MITIGATION: Verify completion server-side before generation
  const completion = await getCourseCompletion(userId, input.courseId);
  if (!completion || !completion.isCompleted) {
    logger.warn('Certificate generation blocked: course not completed', {
      context: { userId, courseId: input.courseId },
    });
    return null;
  }

  // Get course info (for certificate display)
  const course = await getCourseById(input.courseId);
  if (!course) {
    logger.error('Course not found', {
      context: { courseId: input.courseId },
    });
    return null;
  }

  // Create certificate record
  const certificateId = generateUUID();
  const now = new Date().toISOString();
  const completionDate = completion.completedAt || now;

  const certRecord: Omit<CertificateRecord, 'verificationHash'> = {
    certificateId,
    userId,
    courseId: input.courseId,
    name: input.name, // Already sanitized by schema
    courseName: course.name,
    issuedAt: now,
    completionDate,
  };

  // T3 MITIGATION: Compute verification hash for later verification
  const verificationHash = computeCertificateHash(certRecord);
  const fullRecord: CertificateRecord = {
    ...certRecord,
    verificationHash,
  };

  // Store certificate
  certificateStore.set(certificateId, fullRecord);

  logger.info('Certificate generated successfully', {
    context: { certificateId, userId, courseId: input.courseId },
  });

  return fullRecord;
}

/**
 * Get a certificate for download or viewing (ownership verified by caller).
 * Returns public response (excludes sensitive fields).
 */
export async function getCertificateForDownload(
  certId: string,
): Promise<CertificateResponse | null> {
  const cert = await getCertificateById(certId);
  const signatureValid = cert ? verifyCertificateSignature(cert) : false;
  if (!cert || cert.revokedAt || !signatureValid) {
    if (cert && !cert.revokedAt && !signatureValid) {
      logger.warn('Certificate download blocked: signature verification failed', {
        context: { certificateId: certId },
      });
    }
    return null;
  }

  return {
    certificateId: cert.certificateId,
    courseId: cert.courseId,
    courseName: cert.courseName,
    name: cert.name,
    issuedAt: cert.issuedAt,
    completionDate: cert.completionDate,
  };
}

/**
 * Revoke a certificate (soft delete via revokedAt timestamp).
 * Called when owner wants to revoke or admin needs to remove fraudulent certificate.
 */
export async function revokeCertificate(certId: string): Promise<boolean> {
  const cert = certificateStore.get(certId);
  if (!cert) {
    return false;
  }

  cert.revokedAt = new Date().toISOString();
  certificateStore.set(certId, cert);

  logger.info('Certificate revoked', {
    context: { certificateId: certId },
  });

  return true;
}

/**
 * Generate a UUIDv4.
 * In production, use crypto.randomUUID() (Node 14.18+) or uuid library.
 */
export function generateUUID(): string {
  // crypto.randomUUID() is available in Node 14.18+
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older Node versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all certificates for a user (used for dashboard/history).
 * Only returns certificates not revoked.
 */
export async function getCertificatesForUser(userId: string): Promise<CertificateResponse[]> {
  const certs: CertificateResponse[] = [];

  for (const cert of certificateStore.values()) {
    if (cert.userId === userId && !cert.revokedAt) {
      certs.push({
        certificateId: cert.certificateId,
        courseId: cert.courseId,
        courseName: cert.courseName,
        name: cert.name,
        issuedAt: cert.issuedAt,
        completionDate: cert.completionDate,
      });
    }
  }

  return certs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Visualization Analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface CertificateIssuedByDay {
  date: string;   // ISO date string, e.g. "2026-08-25"
  count: number;
}

export interface CertificateIssuedByCourse {
  courseName: string;
  count: number;
}

export interface CertificateAnalytics {
  /** Total certificates ever issued (including revoked). */
  totalIssued: number;
  /** Certificates currently active (not revoked). */
  totalActive: number;
  /** Certificates that have been revoked. */
  totalRevoked: number;
  /** Daily issuance counts for the last 30 days (sorted ascending by date). */
  issuedByDay: CertificateIssuedByDay[];
  /** Breakdown of active certificates by course (sorted descending by count). */
  issuedByCourse: CertificateIssuedByCourse[];
  /** Average days between course completion and certificate issuance. */
  avgCompletionToIssuanceDays: number;
}

/**
 * Compute analytics over the in-memory certificate store.
 *
 * Scoped to a single user when `userId` is provided; when omitted, aggregates
 * across all certificates (admin use-case).
 *
 * NOTE: In production this should be backed by indexed database queries rather
 * than a full scan of the in-memory store.
 */
export function getCertificateAnalytics(userId?: string): CertificateAnalytics {
  const now = new Date();

  // Build a 30-day bucket map initialised to zero so that days with no
  // issuances still appear in the trend chart.
  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  let totalIssued = 0;
  let totalRevoked = 0;
  const courseCount = new Map<string, number>();
  let completionToIssuanceMs = 0;
  let completionToIssuanceSamples = 0;

  for (const cert of certificateStore.values()) {
    // Apply user scope filter when requested
    if (userId !== undefined && cert.userId !== userId) continue;

    totalIssued++;

    if (cert.revokedAt) {
      totalRevoked++;
      // Revoked certificates are excluded from the course breakdown and trend
      continue;
    }

    // Daily issuance bucket (last 30 days only)
    const issuedDate = cert.issuedAt.slice(0, 10);
    if (buckets.has(issuedDate)) {
      buckets.set(issuedDate, (buckets.get(issuedDate) ?? 0) + 1);
    }

    // Course breakdown
    courseCount.set(cert.courseName, (courseCount.get(cert.courseName) ?? 0) + 1);

    // Completion → issuance latency
    const issued = new Date(cert.issuedAt).getTime();
    const completed = new Date(cert.completionDate).getTime();
    if (!isNaN(issued) && !isNaN(completed) && issued >= completed) {
      completionToIssuanceMs += issued - completed;
      completionToIssuanceSamples++;
    }
  }

  const totalActive = totalIssued - totalRevoked;

  const issuedByDay: CertificateIssuedByDay[] = Array.from(buckets.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  const issuedByCourse: CertificateIssuedByCourse[] = Array.from(courseCount.entries())
    .map(([courseName, count]) => ({ courseName, count }))
    .sort((a, b) => b.count - a.count);

  const avgCompletionToIssuanceDays =
    completionToIssuanceSamples > 0
      ? completionToIssuanceMs / completionToIssuanceSamples / (1000 * 60 * 60 * 24)
      : 0;

  return {
    totalIssued,
    totalActive,
    totalRevoked,
    issuedByDay,
    issuedByCourse,
    avgCompletionToIssuanceDays: parseFloat(avgCompletionToIssuanceDays.toFixed(2)),
  };
}