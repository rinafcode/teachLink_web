import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';
import { z } from 'zod';

const logger = createLogger('conference-meetings-api');

const CreateMeetingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  hostId: z.string().min(1, 'Host ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title must be less than 200 characters'),
});

/**
 * POST /api/conference/meetings
 *
 * Create a new video meeting.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T2: Input validation (schema validation)
 * ✓ T8: Audit logging of modifications
 */
export async function POST(request: NextRequest) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Meeting creation attempt without auth');
    return authError;
  }

  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    const body = await request.json();

    // T2 MITIGATION: Input validation using schema
    const validationResult = CreateMeetingSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid meeting input', {
        context: { requesterId, errors: validationResult.error.errors },
      });

      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Verify that the hostId matches the requester (ownership check)
    if (input.hostId !== requesterId) {
      logger.warn('Unauthorized meeting creation attempt', {
        context: { requesterId, hostId: input.hostId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'create',
        targetType: 'meeting',
        targetId: input.roomId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'unauthorized_access' },
      });

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert meeting into database
    const result = await query(
      `INSERT INTO meetings (room_id, host_id, title, status, recording_enabled, created_at, started_at)
       VALUES ($1, $2, $3, 'active', false, NOW(), NOW())
       RETURNING id, room_id, host_id, title, status, recording_enabled, created_at, started_at`,
      [input.roomId, input.hostId, input.title],
    );

    const meeting = result.rows[0];

    // Add host as first participant
    await query(
      `INSERT INTO meeting_participants (meeting_id, user_id, name, role, joined_at)
       VALUES ($1, $2, 'Host', 'host', NOW())`,
      [meeting.id, input.hostId],
    );

    // T8 MITIGATION: Log successful creation
    appendAuditLog({
      actorId: requesterId,
      action: 'create',
      targetType: 'meeting',
      targetId: meeting.id,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 201,
    });

    logger.info('Meeting created successfully', {
      context: { meetingId: meeting.id, roomId: input.roomId },
    });

    return NextResponse.json(
      {
        data: {
          id: meeting.id,
          roomId: meeting.room_id,
          hostId: meeting.host_id,
          title: meeting.title,
          status: meeting.status,
          recordingEnabled: meeting.recording_enabled,
          createdAt: meeting.created_at.toISOString(),
          startedAt: meeting.started_at.toISOString(),
          participants: [
            {
              id: `participant-${input.hostId}`,
              name: 'Host',
              userId: input.hostId,
              joinedAt: meeting.started_at.toISOString(),
              role: 'host',
            },
          ],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('Meeting creation error', {
      context: { requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'create',
      targetType: 'meeting',
      targetId: 'unknown',
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
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
