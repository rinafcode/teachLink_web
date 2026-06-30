import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { LoginRequestSchema } from '@/types/api/auth.dto';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import { getVerificationStatus } from '@/lib/auth/email-verification';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types/api';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  edgeLog('info', '/api/auth/login', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const result = validateBody(LoginRequestSchema, await request.json());
    if (!result.ok) return addHeaders(result.error) as NextResponse;

    const { email, password } = result.data;
    const verification = await getVerificationStatus(email);

    // Mock: demo credentials
    if (email === 'demo@teachlink.com' && password === 'password123') {
      const user = { id: '1', name: 'Demo User', email };
      const token = await signToken({ sub: user.id, role: UserRole.STUDENT });
      return addHeaders(
        NextResponse.json({ message: 'Login successful', user, token }, { status: 200 }),
      );
    }

    if (verification && verification.required && verification.status !== 'verified') {
      return addHeaders(
        NextResponse.json(
          { message: 'Email verification required', verification },
          { status: 403 },
        ),
      );
    }

    // Mock: accept any valid email + password >= 6 chars
    if (password.length >= 6) {
      const user = {
        id: Math.random().toString(36).substring(2, 9),
        name: email.split('@')[0],
        email,
      };
      const token = await signToken({ sub: user.id, role: UserRole.STUDENT });
      return addHeaders(
        NextResponse.json({ message: 'Login successful', user, token }, { status: 200 }),
      );
    }

    return addHeaders(NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }));
  } catch (error) {
    console.error('Login error:', error);
    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
