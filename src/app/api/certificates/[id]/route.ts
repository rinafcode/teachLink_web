import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { getCertificateById, getCertificateForDownload } from '@/services/certificate-service';

const logger = createLogger('certificates-retrieve');

/**
 * GET /api/certificates/:id
 * 
 * Retrieve certificate metadata (requires ownership verification).
 * 
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T7: Opaque UUIDs (no sequential ID enumeration)
 * ✓ T8: Audit logging of access attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Certificate access attempt without auth');
    return authError;
  }

  const certificateId = params.id;
  const userId = request.headers.get('x-user-id') || 'anonymous';

  if (userId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json(
      { error: 'User identification failed' },
      { status: 500 },
    );
  }

  try {
    // Fetch certificate
    const certificate = await getCertificateById(certificateId);

    if (!certificate) {
      logger.warn('Certificate not found', {
        context: { certificateId, requesterId: userId },
      });

      // T8 MITIGATION: Log the access attempt
      appendAuditLog({
        actorId: userId,
        action: 'update', // Using 'update' for read attempts (audit logging convention)
        targetType: 'certificate',
        targetId: certificateId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 404,
        metadata: { reason: 'not_found' },
      });

      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 },
      );
    }

    // T1 MITIGATION: Ownership verification (IDOR prevention)
    if (certificate.userId !== userId) {
      logger.warn('Unauthorized certificate access attempt', {
        context: {
          requesterId: userId,
          certificateId,
          ownerId: certificate.userId,
        },
      });

      // T8 MITIGATION: Log failed access attempt
      appendAuditLog({
        actorId: userId,
        action: 'update', // Using 'update' for access attempts
        targetType: 'certificate',
        targetId: certificateId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: {
          reason: 'unauthorized_access',
          certificateOwnerId: certificate.userId,
        },
      });

      // SECURITY: Return 404, not 403, to avoid leaking certificate existence
      // Tradeoff: Legitimate owner cannot distinguish "doesn't exist" from "not mine"
      // Rationale: Prevents enumeration of valid certificate IDs by iterating numbers
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 },
      );
    }

    const response = await getCertificateForDownload(certificateId);
    if (!response) {
      return NextResponse.json(
        { error: 'Certificate revoked or deleted' },
        { status: 404 },
      );
    }

    // T8 MITIGATION: Log successful access
    appendAuditLog({
      actorId: userId,
      action: 'update', // Using 'update' for view actions
      targetType: 'certificate',
      targetId: certificateId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
    });

    logger.info('Certificate retrieved successfully', {
      context: { certificateId, userId },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('Certificate retrieval error', {
      context: { certificateId, userId },
      error,
    });

    // T8 MITIGATION: Log error
    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: certificateId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json(
      { error: 'Failed to retrieve certificate' },
      { status: 500 },
    );
  }
}

/**
 * Extract client IP from request headers.
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
