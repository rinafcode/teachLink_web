import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

const logger = createLogger('conference-toggle-recording-api');

/**
 * POST /api/conference/meetings/{meetingId}/toggle-recording
 *
 * Toggle recording for a meeting.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T8: Audit logging of modifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Recording toggle attempt without auth');
    return authError;
  }

  const meetingId = params.meetingId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // Verify meeting exists and requester is the host
    const meetingCheck = await query(
      `SELECT id, host_id, recording_enabled, status FROM meetings WHERE id = $1`,
      [meetingId],
    );

    if (meetingCheck.rows.length === 0) {
      logger.warn('Meeting not found', { context: { meetingId, requesterId } });

      appendAuditLog({
        actorId: requesterId,
        action: 'update',
        targetType: 'meeting',
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

    // Only host can toggle recording
    if (meeting.host_id !== requesterId) {
      logger.warn('Unauthorized recording toggle attempt', {
        context: { meetingId, requesterId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'update',
        targetType: 'meeting',
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

    // Toggle recording state
    const newRecordingState = !meeting.recording_enabled;
    const newStatus = newRecordingState ? 'recording' : 'active';

    const result = await query(
      `UPDATE meetings
       SET recording_enabled = $1, status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, room_id, host_id, title, status, recording_enabled, created_at, started_at, updated_at`,
      [newRecordingState, newStatus, meetingId],
    );

    const updatedMeeting = result.rows[0];

    // T8 MITIGATION: Log successful toggle
    appendAuditLog({
      actorId: requesterId,
      action: 'update',
      targetType: 'meeting',
      targetId: meetingId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
      metadata: { recording_enabled: newRecordingState },
    });

    logger.info('Recording toggled successfully', {
      context: { meetingId, recordingEnabled: newRecordingState },
    });

    // Get participants
    const participantsResult = await query(
      `SELECT id, user_id, name, role, joined_at
       FROM meeting_participants
       WHERE meeting_id = $1
       ORDER BY joined_at ASC`,
      [meetingId],
    );

    const participants = participantsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      joinedAt: row.joined_at.toISOString(),
      role: row.role,
    }));

    return NextResponse.json(
      {
        data: {
          id: updatedMeeting.id,
          roomId: updatedMeeting.room_id,
          hostId: updatedMeeting.host_id,
          title: updatedMeeting.title,
          status: updatedMeeting.status,
          recordingEnabled: updatedMeeting.recording_enabled,
          createdAt: updatedMeeting.created_at.toISOString(),
          startedAt: updatedMeeting.started_at.toISOString(),
          endedAt: updatedMeeting.ended_at?.toISOString(),
          participants,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Recording toggle error', {
      context: { meetingId, requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'update',
      targetType: 'meeting',
      targetId: meetingId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to toggle recording' }, { status: 500 });
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
