import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { LoginRequestSchema } from '@/types/api/auth.dto';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import { getVerificationStatus } from '@/lib/auth/email-verification';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types/api';
import { findUserByEmail, TIMING_SAFE_DUMMY_HASH } from '@/lib/db/pool';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const user = await findUserByEmail(email);
    const passwordHash = user?.password_hash ?? TIMING_SAFE_DUMMY_HASH;
    const credentialsMatch = await bcrypt.compare(password, passwordHash);

    if (!user || !credentialsMatch) {
      return addHeaders(NextResponse.json({ message: 'Invalid credentials' }, { status: 401 }));
    }

    const verification = await getVerificationStatus(email);

    if (verification && verification.required && verification.status !== 'verified') {
      return addHeaders(
        NextResponse.json(
          { message: 'Email verification required', verification },
          { status: 403 },
        ),
      );
    }

    const role = Object.values(UserRole).includes(user.role as UserRole)
      ? (user.role as UserRole)
      : UserRole.STUDENT;
    const token = await signToken({ sub: user.id, role, email });

    return addHeaders(
      NextResponse.json(
        {
          message: 'Login successful',
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
    console.error('Login error:', error);
    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
