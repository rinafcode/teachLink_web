import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';
import { ConferenceInputSchema } from '@/schemas/conference.schema';

const logger = createLogger('conference-detail-api');

/**
 * PUT /api/profile/{userId}/conferences/{conferenceId}
 *
 * Update an existing conference on a user's profile.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T2: Input validation (schema validation)
 * ✓ T8: Audit logging of modifications
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; conferenceId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Conference update attempt without auth');
    return authError;
  }

  const userId = params.userId;
  const conferenceId = params.conferenceId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // T1 MITIGATION: Ownership verification - users can only update their own conferences
    if (userId !== requesterId) {
      logger.warn('Unauthorized conference update attempt', {
        context: { requesterId, targetUserId: userId, conferenceId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'update',
        targetType: 'conference',
        targetId: conferenceId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'unauthorized_access' },
      });

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // T2 MITIGATION: Input validation using schema
    const validationResult = ConferenceInputSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid conference input', {
        context: { userId, conferenceId, errors: validationResult.error.errors },
      });

      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Check if conference exists and belongs to user
    const existingResult = await query(
      `SELECT id FROM conferences WHERE id = $1 AND user_id = $2`,
      [conferenceId, userId],
    );

    if (existingResult.rows.length === 0) {
      logger.warn('Conference not found or access denied', {
        context: { userId, conferenceId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'update',
        targetType: 'conference',
        targetId: conferenceId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 404,
        metadata: { reason: 'not_found' },
      });

      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update conference in database
    const result = await query(
      `UPDATE conferences
       SET title = $1, role = $2, date = $3, location = $4, url = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, title, role, date, location, url, created_at, updated_at`,
      [input.title, input.role, input.date, input.location || null, input.url || null, conferenceId, userId],
    );

    const conference = result.rows[0];

    // T8 MITIGATION: Log successful update
    appendAuditLog({
      actorId: requesterId,
      action: 'update',
      targetType: 'conference',
      targetId: conferenceId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
    });

    logger.info('Conference updated successfully', {
      context: { userId, conferenceId },
    });

    return NextResponse.json(
      {
        data: {
          id: conference.id,
          title: conference.title,
          role: conference.role,
          date: conference.date.toISOString(),
          location: conference.location,
          url: conference.url,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Conference update error', {
      context: { userId, conferenceId, requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'update',
      targetType: 'conference',
      targetId: conferenceId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to update conference' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/{userId}/conferences/{conferenceId}
 *
 * Delete a conference from a user's profile.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T8: Audit logging of deletions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; conferenceId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Conference deletion attempt without auth');
    return authError;
  }

  const userId = params.userId;
  const conferenceId = params.conferenceId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // T1 MITIGATION: Ownership verification - users can only delete their own conferences
    if (userId !== requesterId) {
      logger.warn('Unauthorized conference deletion attempt', {
        context: { requesterId, targetUserId: userId, conferenceId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'delete',
        targetType: 'conference',
        targetId: conferenceId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'unauthorized_access' },
      });

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if conference exists and belongs to user
    const existingResult = await query(
      `SELECT id FROM conferences WHERE id = $1 AND user_id = $2`,
      [conferenceId, userId],
    );

    if (existingResult.rows.length === 0) {
      logger.warn('Conference not found or access denied', {
        context: { userId, conferenceId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'delete',
        targetType: 'conference',
        targetId: conferenceId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 404,
        metadata: { reason: 'not_found' },
      });

      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete conference from database
    await query(
      `DELETE FROM conferences WHERE id = $1 AND user_id = $2`,
      [conferenceId, userId],
    );

    // T8 MITIGATION: Log successful deletion
    appendAuditLog({
      actorId: requesterId,
      action: 'delete',
      targetType: 'conference',
      targetId: conferenceId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
    });

    logger.info('Conference deleted successfully', {
      context: { userId, conferenceId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('Conference deletion error', {
      context: { userId, conferenceId, requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'delete',
      targetType: 'conference',
      targetId: conferenceId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to delete conference' }, { status: 500 });
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
