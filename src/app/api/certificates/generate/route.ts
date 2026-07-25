import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { validateBody } from '@/lib/validation';
import { slidingWindowRateLimit } from '@/lib/ratelimit';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { CertificateInputSchema } from '@/schemas/certificate.schema';
import { generateCertificate } from '@/services/certificate-service';

const logger = createLogger('certificates-generate');

/**
 * POST /api/certificates/generate
 *
 * Generate a certificate for a completed course.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T5: Per-user rate limiting (10 per 15 minutes)
 * ✓ T3: Completion verification (in certificate-service)
 * ✓ T2: Input sanitization (via schema)
 * ✓ T8: Audit logging
 */
export async function POST(request: NextRequest) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Certificate generation attempt without auth');
    return authError;
  }

  // Extract user ID from headers (matches codebase pattern)
  const userId = request.headers.get('x-user-id') || 'anonymous';
  if (userId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  // T5 MITIGATION: Per-user rate limiting
  // Configuration: 10 certificates per 15 minutes per user
  const rateLimitKey = `cert-generate-${userId}`;
  const rateLimitResult = slidingWindowRateLimit(rateLimitKey, {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.success) {
    const retryAfter = rateLimitResult.retryAfter || 60;
    logger.warn('Certificate generation rate limited', {
      context: { userId, retryAfter },
    });

    // T8 MITIGATION: Log rate limit event
    appendAuditLog({
      actorId: userId,
      action: 'create',
      targetType: 'certificate',
      targetId: 'rate-limited',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 429,
      metadata: { reason: 'rate_limit_exceeded' },
    });

    return NextResponse.json(
      { error: 'Too many certificate generation requests. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.reset / 1000)),
        },
      },
    );
  }

  // T2 MITIGATION: Parse and validate input against schema (with sanitization)
  const bodyValidation = await validateBody(CertificateInputSchema, await request.json());
  if (!bodyValidation.ok) {
    logger.warn('Certificate generation request validation failed', {
      context: { userId },
    });

    // T8 MITIGATION: Log validation error
    appendAuditLog({
      actorId: userId,
      action: 'create',
      targetType: 'certificate',
      targetId: 'validation-failed',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 400,
      metadata: { reason: 'input_validation_failed' },
    });

    return bodyValidation.error;
  }

  const input = bodyValidation.data;

  try {
    // T3 MITIGATION: Generate certificate with server-side completion verification
    const certificate = await generateCertificate(userId, input);

    if (!certificate) {
      // Certificate generation failed (likely course not completed)
      logger.warn('Certificate generation failed: preconditions not met', {
        context: { userId, courseId: input.courseId },
      });

      // T8 MITIGATION: Log failed attempt
      appendAuditLog({
        actorId: userId,
        action: 'create',
        targetType: 'certificate',
        targetId: `course-${input.courseId}`,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'course_not_completed_or_invalid' },
      });

      return NextResponse.json({ error: 'Course not completed or invalid' }, { status: 403 });
    }

    // T8 MITIGATION: Log successful certificate generation
    appendAuditLog({
      actorId: userId,
      action: 'create',
      targetType: 'certificate',
      targetId: certificate.certificateId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 201,
      metadata: {
        courseId: certificate.courseId,
        courseName: certificate.courseName,
      },
    });

    logger.info('Certificate generated successfully', {
      context: {
        certificateId: certificate.certificateId,
        userId,
        courseId: input.courseId,
      },
    });

    return NextResponse.json(
      {
        certificateId: certificate.certificateId,
        courseId: certificate.courseId,
        name: certificate.name,
        issuedAt: certificate.issuedAt,
        completionDate: certificate.completionDate,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('Certificate generation error', {
      context: { userId, courseId: input.courseId },
      error,
    });

    // T8 MITIGATION: Log error event
    appendAuditLog({
      actorId: userId,
      action: 'create',
      targetType: 'certificate',
      targetId: `course-${input.courseId}`,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}

/**
 * Extract client IP from request headers.
 * Matches pattern from audit middleware.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}