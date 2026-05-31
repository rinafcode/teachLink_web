import { z } from 'zod';

/**
 * Input sanitization schema for certificate generation.
 * Enforces max lengths, rejects dangerous patterns, and validates types.
 */
export const CertificateInputSchema = z.object({
  courseId: z
    .string()
    .uuid('courseId must be a valid UUID')
    .describe('UUID of the course'),

  name: z
    .string()
    .min(1, 'name is required')
    .max(100, 'name must be 100 characters or less')
    .regex(
      /^[^<>]*$/,
      'name must not contain HTML tags',
    )
    .regex(
      /^(?!.*(?:javascript:|data:|<script|\.\.\/|\.\.\\))/i,
      'name contains forbidden patterns',
    )
    .transform((val) => val.trim())
    .describe('Student name for the certificate (max 100 chars)'),
});

export type CertificateInput = z.infer<typeof CertificateInputSchema>;

/**
 * Certificate record as stored in the database.
 */
export const CertificateRecordSchema = z.object({
  certificateId: z.string().uuid().describe('Unique certificate identifier'),
  userId: z.string().uuid().describe('User ID of certificate owner'),
  courseId: z.string().uuid().describe('Course ID'),
  name: z.string().describe('Sanitized student name'),
  courseName: z.string().describe('Course name'),
  issuedAt: z.string().datetime().describe('Timestamp when certificate was issued'),
  completionDate: z.string().datetime().describe('Timestamp when course was completed'),
  verificationHash: z.string().describe('SHA256 hash for verification'),
  revokedAt: z.string().datetime().nullable().optional().describe('Revocation timestamp if revoked'),
});

export type CertificateRecord = z.infer<typeof CertificateRecordSchema>;

/**
 * Public API response for certificate retrieval.
 */
export const CertificateResponseSchema = z.object({
  certificateId: z.string().uuid(),
  courseId: z.string().uuid(),
  courseName: z.string(),
  name: z.string(),
  issuedAt: z.string().datetime(),
  completionDate: z.string().datetime(),
});

export type CertificateResponse = z.infer<typeof CertificateResponseSchema>;

/**
 * Certificate verification response (public endpoint).
 */
export const CertificateVerificationSchema = z.object({
  valid: z.boolean().describe('Whether the certificate is valid and authentic'),
  certificateId: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  issuedAt: z.string().datetime(),
  completionDate: z.string().datetime(),
});

export type CertificateVerification = z.infer<typeof CertificateVerificationSchema>;

/**
 * Course completion check.
 * Used to verify that user has completed a course before generating certificate.
 */
export const CourseCompletionSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().optional(),
});

export type CourseCompletion = z.infer<typeof CourseCompletionSchema>;
