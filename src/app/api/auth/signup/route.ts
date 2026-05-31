import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { SignupRequestSchema } from '@/types/api/auth.dto';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  const route = '/api/auth/signup';
  edgeLog('info', route, 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(SignupRequestSchema, await request.json());
    if (!result.ok) {
      edgeLog('warn', route, 'Validation failed', { reason: 'schema' });
      return addHeaders(result.error) as NextResponse;
    }

    const { name, email, password, confirmPassword } = result.data;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      edgeLog('warn', route, 'Validation failed', { reason: 'missing_fields' });
      return addHeaders(NextResponse.json({ message: 'All fields are required' }, { status: 400 }));
    }

    if (password !== confirmPassword) {
      edgeLog('warn', route, 'Validation failed', { reason: 'password_mismatch' });
      return addHeaders(NextResponse.json({ message: "Passwords don't match" }, { status: 400 }));
    }

    if (password.length < 6) {
      edgeLog('warn', route, 'Validation failed', { reason: 'password_too_short' });
      return addHeaders(
        NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 }),
      );
    }

    // Mock: block already-registered email
    if (email === 'existing@teachlink.com') {
      edgeLog('warn', route, 'Registration conflict', { reason: 'email_exists' });
      return addHeaders(
        NextResponse.json({ message: 'Email already registered' }, { status: 409 }),
      );
    }

    const userId = Math.random().toString(36).substring(2, 9);
    edgeLog('info', route, 'Account created', { userId });

    return addHeaders(
      NextResponse.json(
        {
          message: 'Account created successfully',
          user: { id: userId, name, email },
          token: `mock-jwt-token-${Date.now()}`,
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    edgeLog('error', route, 'Unhandled signup error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
