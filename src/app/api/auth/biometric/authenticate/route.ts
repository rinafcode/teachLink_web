import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { z } from 'zod';
import { edgeLog } from '@/../../infra/edge-config';
import { createLogger } from '@/lib/logging';
import { signToken } from '@/lib/auth/jwt';
import { findUserByEmail } from '@/lib/db/pool';
import {
  generateAuthOptions,
  verifyAuthResponse,
  hasActiveCredentials,
} from '@/lib/auth/biometric';

const logger = createLogger('api-biometric-auth');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const StartAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const CompleteAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  credential: z.any(), // PublicKeyCredential serialized from client
});

// ---------------------------------------------------------------------------
// POST /api/auth/biometric/authenticate — Step 1: Generate auth options
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/authenticate', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(StartAuthSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { email } = result.data;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return addHeaders(
        NextResponse.json(
          { message: 'No biometric credentials found for this account' },
          { status: 404 },
        ),
      );
    }

    // Check if user has active biometric credentials
    if (!hasActiveCredentials(user.id)) {
      return addHeaders(
        NextResponse.json(
          { message: 'No biometric credentials found. Please sign in with your password.' },
          { status: 404 },
        ),
      );
    }

    const rpId = request.headers.get('host') ?? 'localhost';

    const options = generateAuthOptions(user.id, { rpId });

    return addHeaders(
      NextResponse.json(
        { options, userId: user.id },
        { status: 200 },
      ),
    );
  } catch (error) {
    logger.error('Biometric auth start error', { error });
    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/auth/biometric/authenticate — Step 2: Verify credential and sign token
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  edgeLog('info', '/api/auth/biometric/authenticate', 'PUT request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(CompleteAuthSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { email, credential } = result.data;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return addHeaders(
        NextResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      );
    }

    // Verify the biometric credential
    const { verified } = verifyAuthResponse(user.id, credential);

    if (!verified) {
      return addHeaders(
        NextResponse.json({ message: 'Biometric verification failed' }, { status: 401 }),
      );
    }

    // Sign a JWT token
    const role = user.role as any;
    const token = await signToken({ sub: user.id, role, email });

    return addHeaders(
      NextResponse.json(
        {
          message: 'Biometric authentication successful',
          user: {
            id: user.id,
            name: email.split('@')[0],
            email,
            role: user.role,
          },
          token,
        },
        { status: 200 },
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Biometric auth completion error', { error });

    if (message.includes('challenge') || message.includes('not found')) {
      return addHeaders(
        NextResponse.json({ message }, { status: 400 }),
      );
    }

    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    );
  }
}