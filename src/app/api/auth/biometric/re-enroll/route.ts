import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { edgeLog } from '@/../../infra/edge-config';
import { createLogger } from '@/lib/logging';
import { verifyToken } from '@/lib/auth/jwt';
import { findUserByEmail, TIMING_SAFE_DUMMY_HASH } from '@/lib/db/pool';
import {
  initiateReEnrollment,
  verifyEnrollmentResponse,
  hasActiveCredentials,
  getActiveCredentialCount,
} from '@/lib/auth/biometric';

const logger = createLogger('api-biometric-reenroll');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const StartReEnrollSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const CompleteReEnrollSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  credential: z.any(), // PublicKeyCredential serialized from client
});

const StatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/biometric/re-enroll — Step 1: Verify identity + initiate re-enrollment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/re-enroll', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(StartReEnrollSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { email, password } = result.data;

    // Find user by email
    const user = await findUserByEmail(email);
    const passwordHash = user?.password_hash ?? TIMING_SAFE_DUMMY_HASH;
    const credentialsMatch = await bcrypt.compare(password, passwordHash);

    if (!user || !credentialsMatch) {
      return addHeaders(
        NextResponse.json(
          { message: 'Invalid credentials. Re-enrollment requires password verification.' },
          { status: 401 },
        ),
      );
    }

    const rpId = request.headers.get('host') ?? 'localhost';
    const rpName = 'TeachLink';
    const userName = email.split('@')[0];

    // Get count of existing credentials before deactivation
    const oldCredentialCount = getActiveCredentialCount(user.id);

    // Initiate re-enrollment (deactivates old credentials, generates new options)
    const options = initiateReEnrollment(user.id, {
      rpName,
      rpId,
      userName,
      userId: user.id,
    });

    logger.info('Biometric re-enrollment initiated', {
      userId: user.id,
      oldCredentialCount,
    });

    return addHeaders(
      NextResponse.json(
        {
          options,
          userId: user.id,
          oldCredentialCount,
          message:
            oldCredentialCount > 0
              ? `${oldCredentialCount} existing credential(s) deactivated. Please enroll a new biometric.`
              : 'No existing credentials found. Proceeding with fresh enrollment.',
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    logger.error('Biometric re-enrollment start error', { error });
    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/auth/biometric/re-enroll — Step 2: Complete re-enrollment with new credential
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/re-enroll', 'PUT request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return addHeaders(
        NextResponse.json({ message: 'Authentication required' }, { status: 401 }),
      );
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return addHeaders(
        NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 }),
      );
    }

    const result = validateBody(CompleteReEnrollSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { userId, credential } = result.data;

    // Verify the authenticated user matches
    if (payload.sub !== userId) {
      return addHeaders(
        NextResponse.json({ message: 'User ID mismatch' }, { status: 403 }),
      );
    }

    const newCredential = verifyEnrollmentResponse(userId, credential);

    return addHeaders(
      NextResponse.json(
        {
          message: 'Biometric re-enrollment successful',
          credential: {
            id: newCredential.id,
            deviceLabel: newCredential.deviceLabel,
            enrolledAt: newCredential.enrolledAt,
          },
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Biometric re-enrollment completion error', { error });

    if (message.includes('challenge')) {
      return addHeaders(
        NextResponse.json({ message }, { status: 400 }),
      );
    }

    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/biometric/re-enroll?userId=xxx — Check re-enrollment status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/re-enroll', 'GET request received');

  const { addHeaders } = withRateLimit(request, 'AUTH');

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return addHeaders(
        NextResponse.json({ message: 'User ID is required' }, { status: 400 }),
      );
    }

    const hasActive = hasActiveCredentials(userId);
    const activeCount = getActiveCredentialCount(userId);

    return addHeaders(
      NextResponse.json(
        {
          hasActiveCredentials: hasActive,
          activeCredentialCount: activeCount,
          needsReEnrollment: !hasActive,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    logger.error('Biometric re-enrollment status error', { error });
    return addHeaders(
      NextResponse.json(
        { hasActiveCredentials: false, activeCredentialCount: 0, needsReEnrollment: true },
        { status: 200 },
      ),
    );
  }
}