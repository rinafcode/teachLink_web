import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';
import { edgeLog } from '@/../../infra/edge-config';
import { createLogger } from '@/lib/logging';
import { verifyToken } from '@/lib/auth/jwt';
import {
  generateEnrollmentOptions,
  verifyEnrollmentResponse,
  isBiometricSupported,
} from '@/lib/auth/biometric';

const logger = createLogger('api-biometric-enroll');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const StartEnrollmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userName: z.string().min(1, 'User name is required'),
});

const CompleteEnrollmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  credential: z.any(), // PublicKeyCredential serialized from client
});

// ---------------------------------------------------------------------------
// POST /api/auth/biometric/enroll — Step 1: Generate enrollment options
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/enroll', 'POST request received');

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

    const result = validateBody(StartEnrollmentSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { userId, userName } = result.data;

    // Verify the authenticated user matches the enrollment target
    if (payload.sub !== userId) {
      return addHeaders(
        NextResponse.json({ message: 'User ID mismatch' }, { status: 403 }),
      );
    }

    const rpId = request.headers.get('host') ?? 'localhost';
    const rpName = 'TeachLink';

    const options = generateEnrollmentOptions({
      rpName,
      rpId,
      userName,
      userId,
    });

    return addHeaders(
      NextResponse.json({ options }, { status: 200 }),
    );
  } catch (error) {
    logger.error('Biometric enrollment start error', { error });
    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/auth/biometric/enroll — Step 2: Verify and store credential
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/enroll', 'PUT request received');

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

    const result = validateBody(CompleteEnrollmentSchema, await request.json());
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
          message: 'Biometric enrollment successful',
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
    logger.error('Biometric enrollment completion error', { error });

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
// GET /api/auth/biometric/enroll/status — Check if biometric is available
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/enroll', 'GET request received');

  const { addHeaders } = withRateLimit(request, 'AUTH');

  try {
    const supported = isBiometricSupported();

    return addHeaders(
      NextResponse.json(
        {
          supported,
          platformAuthenticator: supported ? await isBiometricSupported() : false,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    logger.error('Biometric status check error', { error });
    return addHeaders(
      NextResponse.json({ supported: false, platformAuthenticator: false }, { status: 200 }),
    );
  }
}