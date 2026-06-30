import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { ResendVerificationRequestSchema } from '@/types/api/auth.dto';
import type { AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import {
  buildVerificationMailContext,
  getVerificationTokenTtlMinutes,
  resendVerificationEmail,
} from '@/lib/auth/email-verification';
import { notificationService } from '@/services/notifications';

export const runtime = 'nodejs';

type ResendResponseDTO =
  | {
      message: string;
      verification: { status: 'pending' | 'already_verified' | 'expired' | 'cooldown' };
    }
  | AuthErrorDTO;

export async function POST(request: NextRequest): Promise<NextResponse<ResendResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const payload = validateBody(ResendVerificationRequestSchema, await request.json());
    if (!payload.ok) return addHeaders(payload.error) as NextResponse;

    const result = await resendVerificationEmail(payload.data.email);

    if ('verificationToken' in result) {
      const mailContext = buildVerificationMailContext(
        result.record,
        result.verificationToken,
        result.backupCode,
      );
      await notificationService.sendEmailVerificationEmail(mailContext);

      return addHeaders(
        NextResponse.json({
          message: `Verification email resent. It expires in ${getVerificationTokenTtlMinutes()} minutes.`,
          verification: { status: 'pending' },
        }),
      );
    }

    if (result.status === 'already_verified') {
      return addHeaders(
        NextResponse.json({
          message: 'Email already verified',
          verification: { status: 'already_verified' },
        }),
      );
    }

    if (result.status === 'cooldown') {
      return addHeaders(
        NextResponse.json(
          {
            message: 'Please wait before requesting another verification email',
            verification: { status: 'cooldown' },
          },
          { status: 429 },
        ),
      );
    }

    return addHeaders(
      NextResponse.json(
        { message: 'Verification request not found', verification: { status: 'expired' } },
        { status: 410 },
      ),
    );
  } catch (error) {
    edgeLog('error', '/api/auth/email-verification/resend', 'Unhandled resend error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
