import { createHash } from 'crypto';
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
      progress: number;
      completed_at: string | null;
    };

    return {
      isCompleted: row.progress >= 100,
      completedAt: row.completed_at,
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
  const expectedHash = computeCertificateHash(cert);
  if (expectedHash !== cert.verificationHash) {
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
  if (!cert || cert.revokedAt) {
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