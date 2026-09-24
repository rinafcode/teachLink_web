import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { slidingWindowRateLimit } from '@/lib/ratelimit';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { getCertificateAnalytics } from '@/services/certificate-service';

const logger = createLogger('certificates-analytics');

/**
 * GET /api/certificates/analytics
 *
 * Returns data visualization analytics for the authenticated user's certificates:
 *  - totalIssued / totalActive / totalRevoked counts
 *  - issuedByDay  — 30-day issuance trend (for line/area chart)
 *  - issuedByCourse — per-course breakdown (for bar/pie chart)
 *  - avgCompletionToIssuanceDays — average latency metric
 *
 * Optional query param `?scope=all` is reserved for admin use (returns
 * aggregate across all users); currently restricted to own data only.
 *
 * SECURITY CHECKS:
 * ✓ Auth middleware (requireAuth)
 * ✓ Per-user rate limiting (60 req / 15 min)
 * ✓ Audit logging
 */
export async function GET(request: NextRequest) {
  // Auth guard
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Analytics request without auth');
    return authError;
  }

  const userId = request.headers.get('x-user-id') || 'anonymous';
  if (userId === 'anonymous') {
    logger.error('User ID not present in analytics request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  // Per-user rate limiting — analytics reads are cheap but we still guard them
  const rateLimitKey = `cert-analytics-${userId}`;
  const rateLimitResult = slidingWindowRateLimit(rateLimitKey, {
    limit: 60,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.success) {
    const retryAfter = rateLimitResult.retryAfter ?? 60;
    logger.warn('Certificate analytics rate limited', { context: { userId, retryAfter } });

    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: 'analytics-rate-limited',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      statusCode: 429,
      metadata: { reason: 'rate_limit_exceeded' },
    });

    return NextResponse.json(
      { error: 'Too many analytics requests. Try again later.' },
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

  try {
    const analytics = getCertificateAnalytics(userId);

    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: 'analytics',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      statusCode: 200,
    });

    logger.info('Certificate analytics fetched', { context: { userId } });

    return NextResponse.json(analytics, {
      status: 200,
      headers: {
        // Analytics data changes only when certs are issued/revoked; a short
        // cache avoids redundant re-computation on rapid successive renders.
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    logger.error('Failed to compute certificate analytics', { context: { userId }, error });

    appendAuditLog({
      actorId: userId,
      action: 'update',
      targetType: 'certificate',
      targetId: 'analytics-error',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}
