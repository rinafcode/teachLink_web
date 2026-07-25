import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

const logger = createLogger('conference-participants-api');

/**
 * GET /api/conference/meetings/{meetingId}/participants
 *
 * List participants in a meeting.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T8: Audit logging of access attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Participants list attempt without auth');
    return authError;
  }

  const meetingId = params.meetingId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // Verify meeting exists and requester is the host or a participant
    const meetingCheck = await query(
      `SELECT host_id FROM meetings WHERE id = $1`,
      [meetingId],
    );

    if (meetingCheck.rows.length === 0) {
      logger.warn('Meeting not found', { context: { meetingId, requesterId } });

      appendAuditLog({
        actorId: requesterId,
        action: 'read',
        targetType: 'meeting_participants',
        targetId: meetingId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 404,
        metadata: { reason: 'meeting_not_found' },
      });

      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = meetingCheck.rows[0];

    // Check if requester is host or participant
    const participantCheck = await query(
      `SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
      [meetingId, requesterId],
    );

    if (meeting.host_id !== requesterId && participantCheck.rows.length === 0) {
      logger.warn('Unauthorized participants list attempt', {
        context: { meetingId, requesterId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'read',
        targetType: 'meeting_participants',
        targetId: meetingId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'unauthorized_access' },
      });

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query participants from database
    const result = await query(
      `SELECT id, user_id, name, role, joined_at
       FROM meeting_participants
       WHERE meeting_id = $1
       ORDER BY joined_at ASC`,
      [meetingId],
    );

    const participants = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      joinedAt: row.joined_at.toISOString(),
      role: row.role,
    }));

    // T8 MITIGATION: Log successful access
    appendAuditLog({
      actorId: requesterId,
      action: 'read',
      targetType: 'meeting_participants',
      targetId: meetingId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
    });

    logger.info('Participants retrieved successfully', {
      context: { meetingId, count: participants.length },
    });

    return NextResponse.json({ data: participants }, { status: 200 });
  } catch (error) {
    logger.error('Participants retrieval error', {
      context: { meetingId, requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'read',
      targetType: 'meeting_participants',
      targetId: meetingId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to retrieve participants' }, { status: 500 });
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
