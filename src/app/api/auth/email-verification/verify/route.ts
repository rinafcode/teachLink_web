import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { VerifyEmailRequestSchema } from '@/types/api/auth.dto';
import type { AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import { verifyEmailToken } from '@/lib/auth/email-verification';

export const runtime = 'nodejs';

type VerifyResponseDTO =
  | { message: string; verification: { status: 'verified' | 'already_verified' | 'expired' } }
  | AuthErrorDTO;

function extractToken(request: NextRequest): string | null {
  const searchParams = new URL(request.url).searchParams;
  const urlToken = searchParams.get('token');
  if (urlToken) return urlToken;

  const headerToken = request.headers.get('x-verification-token');
  if (headerToken) return headerToken;

  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse<VerifyResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const token = extractToken(request);
    if (!token) {
      return addHeaders(NextResponse.json({ message: 'Verification token is required' }, { status: 400 }));
    }

    const result = await verifyEmailToken(token);

    if (result.status === 'verified') {
      return addHeaders(NextResponse.json({ message: 'Email verified', verification: { status: 'verified' } }));
    }

    if (result.status === 'already_verified') {
      return addHeaders(
        NextResponse.json({ message: 'Email already verified', verification: { status: 'already_verified' } }),
      );
    }

    return addHeaders(
      NextResponse.json(
        { message: 'Verification token expired', verification: { status: 'expired' } },
        { status: 410 },
      ),
    );
  } catch (error) {
    edgeLog('error', '/api/auth/email-verification/verify', 'Unhandled verification error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const payload = validateBody(VerifyEmailRequestSchema, await request.json());
    if (!payload.ok) return addHeaders(payload.error) as NextResponse;

    const token = payload.data.token ?? extractToken(request);
    if (!token) {
      return addHeaders(NextResponse.json({ message: 'Verification token is required' }, { status: 400 }));
    }

    const result = await verifyEmailToken(token);

    if (result.status === 'verified') {
      return addHeaders(NextResponse.json({ message: 'Email verified', verification: { status: 'verified' } }));
    }

    if (result.status === 'already_verified') {
      return addHeaders(
        NextResponse.json({ message: 'Email already verified', verification: { status: 'already_verified' } }),
      );
    }

    return addHeaders(
      NextResponse.json(
        { message: 'Verification token expired', verification: { status: 'expired' } },
        { status: 410 },
      ),
    );
  } catch (error) {
    edgeLog('error', '/api/auth/email-verification/verify', 'Unhandled verification error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
