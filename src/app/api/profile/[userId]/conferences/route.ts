import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import { createLogger } from '@/lib/logging';
import { appendAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';
import { ConferenceInputSchema } from '@/schemas/conference.schema';

const logger = createLogger('conferences-api');

/**
 * GET /api/profile/{userId}/conferences
 *
 * Retrieve all conferences for a user's profile.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T8: Audit logging of access attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Conference access attempt without auth');
    return authError;
  }

  const userId = params.userId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // T1 MITIGATION: Ownership verification - users can only access their own conferences
    if (userId !== requesterId) {
      logger.warn('Unauthorized conference access attempt', {
        context: { requesterId, targetUserId: userId },
      });

      // T8 MITIGATION: Log failed access attempt
      appendAuditLog({
        actorId: requesterId,
        action: 'read',
        targetType: 'conferences',
        targetId: userId,
        path: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        statusCode: 403,
        metadata: { reason: 'unauthorized_access' },
      });

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query conferences from database
    const result = await query(
      `SELECT id, title, role, date, location, url, created_at, updated_at
       FROM conferences
       WHERE user_id = $1
       ORDER BY date DESC`,
      [userId],
    );

    const conferences = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      role: row.role,
      date: row.date.toISOString(),
      location: row.location,
      url: row.url,
    }));

    // T8 MITIGATION: Log successful access
    appendAuditLog({
      actorId: requesterId,
      action: 'read',
      targetType: 'conferences',
      targetId: userId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 200,
    });

    logger.info('Conferences retrieved successfully', {
      context: { userId, count: conferences.length },
    });

    return NextResponse.json({ data: conferences }, { status: 200 });
  } catch (error) {
    logger.error('Conference retrieval error', {
      context: { userId, requesterId },
      error,
    });

    // T8 MITIGATION: Log error
    appendAuditLog({
      actorId: requesterId,
      action: 'read',
      targetType: 'conferences',
      targetId: userId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to retrieve conferences' }, { status: 500 });
  }
}

/**
 * POST /api/profile/{userId}/conferences
 *
 * Add a new conference to a user's profile.
 *
 * SECURITY CHECKS:
 * ✓ T4: Auth middleware (requireAuth)
 * ✓ T1: Ownership verification (IDOR mitigation)
 * ✓ T2: Input validation (schema validation)
 * ✓ T8: Audit logging of modifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    logger.warn('Conference creation attempt without auth');
    return authError;
  }

  const userId = params.userId;
  const requesterId = request.headers.get('x-user-id') || 'anonymous';

  if (requesterId === 'anonymous') {
    logger.error('User ID not provided in request headers');
    return NextResponse.json({ error: 'User identification failed' }, { status: 500 });
  }

  try {
    // T1 MITIGATION: Ownership verification - users can only add to their own profile
    if (userId !== requesterId) {
      logger.warn('Unauthorized conference creation attempt', {
        context: { requesterId, targetUserId: userId },
      });

      appendAuditLog({
        actorId: requesterId,
        action: 'create',
        targetType: 'conference',
        targetId: userId,
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
        context: { userId, errors: validationResult.error.errors },
      });

      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Insert conference into database
    const result = await query(
      `INSERT INTO conferences (user_id, title, role, date, location, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, role, date, location, url, created_at, updated_at`,
      [userId, input.title, input.role, input.date, input.location || null, input.url || null],
    );

    const conference = result.rows[0];

    // T8 MITIGATION: Log successful creation
    appendAuditLog({
      actorId: requesterId,
      action: 'create',
      targetType: 'conference',
      targetId: conference.id,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 201,
    });

    logger.info('Conference created successfully', {
      context: { userId, conferenceId: conference.id },
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
      { status: 201 },
    );
  } catch (error) {
    logger.error('Conference creation error', {
      context: { userId, requesterId },
      error,
    });

    appendAuditLog({
      actorId: requesterId,
      action: 'create',
      targetType: 'conference',
      targetId: userId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      statusCode: 500,
      metadata: { reason: 'internal_error' },
    });

    return NextResponse.json({ error: 'Failed to create conference' }, { status: 500 });
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
