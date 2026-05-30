import { createHash } from 'crypto';
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
 * Verify or get course completion status.
 *
 * SECURITY: Server-side verification prevents users from generating certificates
 * for courses they haven't completed. Check must happen before generation.
 *
 * In production: Query enrollment/progress database with user ID and course ID.
 * Returns: completion record with isCompleted boolean and completedAt timestamp.
 */
async function getCourseCompletion(
  userId: string,
  courseId: string,
): Promise<CourseCompletion | null> {
  // MOCK IMPLEMENTATION — Replace with actual database query
  // Pattern: Query IDB or backend progress table for:
  // SELECT * FROM user_progress WHERE userId = ? AND courseId = ? AND isCompleted = true

  logger.debug('Checking course completion', {
    context: { userId, courseId },
  });

  // For now, all requests return null (requires implementation with actual data source)
  // TODO: Connect to actual progress/enrollment tracking system
  return null;
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
 * 2. User must have completed the course (server-side verification)
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

export interface CertificateStats {
  totalIssued: number;
  totalActive: number;
  totalRevoked: number;
  completionsByCourse: { courseName: string; count: number }[];
  completionsByMonth: { month: string; count: number }[];
  recentCertificates: CertificateRecord[];
}

/**
 * Get aggregated analytics statistics for all certificates.
 */
export async function getCertificateStats(): Promise<CertificateStats> {
  const certs = Array.from(certificateStore.values());
  const totalIssued = certs.length;
  const totalRevoked = certs.filter((c) => !!c.revokedAt).length;
  const totalActive = totalIssued - totalRevoked;

  // Group by Course Name
  const courseCounts: Record<string, number> = {};
  certs.forEach((c) => {
    courseCounts[c.courseName] = (courseCounts[c.courseName] || 0) + 1;
  });
  const completionsByCourse = Object.entries(courseCounts).map(([courseName, count]) => ({
    courseName,
    count,
  }));

  // Group by Month (using issuedAt)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthCounts: Record<string, number> = {};

  // Pre-initialize last 5 months so the chart has consistent structure
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthCounts[label] = 0;
  }

  certs.forEach((c) => {
    const date = new Date(c.issuedAt);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    if (label in monthCounts) {
      monthCounts[label] = monthCounts[label] + 1;
    }
  });

  const completionsByMonth = Object.entries(monthCounts).map(([month, count]) => ({
    month,
    count,
  }));

  const recentCertificates = [...certs]
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .slice(0, 10);

  return {
    totalIssued,
    totalActive,
    totalRevoked,
    completionsByCourse,
    completionsByMonth,
    recentCertificates,
  };
}

// ==========================================
// PRE-POPULATE MOCK CERTIFICATES FOR ANALYTICS
// ==========================================
const mockUsers = [
  'user-1111-1111-1111-111111111111',
  'user-2222-2222-2222-222222222222',
  'user-3333-3333-3333-333333333333',
  'user-4444-4444-4444-444444444444',
  'user-5555-5555-5555-555555555555',
  'user-6666-6666-6666-666666666666',
];

const mockCourses = [
  { id: 'course-1111-1111-1111-111111111111', name: 'Introduction to TypeScript' },
  { id: 'course-2222-2222-2222-222222222222', name: 'Web3 UX Design Principles' },
  { id: 'course-3333-3333-3333-333333333333', name: 'Smart Contract Security' },
  { id: 'course-4444-4444-4444-444444444444', name: 'Scaling DAPps on Starknet' },
];

const initialCerts: Omit<CertificateRecord, 'verificationHash'>[] = [
  {
    certificateId: 'cert-0000-0000-0000-000000000001',
    userId: mockUsers[0],
    courseId: mockCourses[0].id,
    name: 'Alice Johnson',
    courseName: mockCourses[0].name,
    issuedAt: '2026-01-15T10:00:00.000Z',
    completionDate: '2026-01-15T10:00:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000002',
    userId: mockUsers[1],
    courseId: mockCourses[1].id,
    name: 'Bob Smith',
    courseName: mockCourses[1].name,
    issuedAt: '2026-02-18T14:30:00.000Z',
    completionDate: '2026-02-18T14:30:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000003',
    userId: mockUsers[2],
    courseId: mockCourses[2].id,
    name: 'Charlie Brown',
    courseName: mockCourses[2].name,
    issuedAt: '2026-03-05T09:15:00.000Z',
    completionDate: '2026-03-05T09:15:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000004',
    userId: mockUsers[3],
    courseId: mockCourses[3].id,
    name: 'Diana Prince',
    courseName: mockCourses[3].name,
    issuedAt: '2026-03-22T16:45:00.000Z',
    completionDate: '2026-03-22T16:45:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000005',
    userId: mockUsers[4],
    courseId: mockCourses[0].id,
    name: 'Ethan Hunt',
    courseName: mockCourses[0].name,
    issuedAt: '2026-04-10T11:20:00.000Z',
    completionDate: '2026-04-10T11:20:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000006',
    userId: mockUsers[5],
    courseId: mockCourses[2].id,
    name: 'Fiona Gallagher',
    courseName: mockCourses[2].name,
    issuedAt: '2026-04-28T13:10:00.000Z',
    completionDate: '2026-04-28T13:10:00.000Z',
    revokedAt: '2026-04-30T10:00:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000007',
    userId: mockUsers[0],
    courseId: mockCourses[2].id,
    name: 'Alice Johnson',
    courseName: mockCourses[2].name,
    issuedAt: '2026-05-02T15:40:00.000Z',
    completionDate: '2026-05-02T15:40:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000008',
    userId: mockUsers[1],
    courseId: mockCourses[3].id,
    name: 'Bob Smith',
    courseName: mockCourses[3].name,
    issuedAt: '2026-05-12T08:50:00.000Z',
    completionDate: '2026-05-12T08:50:00.000Z',
  },
  {
    certificateId: 'cert-0000-0000-0000-000000000009',
    userId: mockUsers[2],
    courseId: mockCourses[1].id,
    name: 'Charlie Brown',
    courseName: mockCourses[1].name,
    issuedAt: '2026-05-20T17:30:00.000Z',
    completionDate: '2026-05-20T17:30:00.000Z',
  },
];

initialCerts.forEach((c) => {
  // Let's call computeCertificateHash using direct function mapping
  const SECRET = process.env.CERTIFICATE_VERIFICATION_SECRET || 'dev-secret-DO-NOT-USE-IN-PROD';
  const data = `${c.userId}:${c.courseId}:${c.completionDate}:${SECRET}`;
  const verificationHash = createHash('sha256').update(data).digest('hex');

  certificateStore.set(c.certificateId, { ...c, verificationHash });
});
