import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { RestoreVerificationRequestSchema } from '@/types/api/auth.dto';
import type { AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';
import {
  buildVerificationMailContext,
  getVerificationTokenTtlMinutes,
  restoreVerificationEmail,
} from '@/lib/auth/email-verification';
import { notificationService } from '@/services/notifications';

export const runtime = 'nodejs';

type RestoreResponseDTO =
  | { message: string; verification: { status: 'pending' | 'already_verified' | 'expired' | 'not_found' } }
  | AuthErrorDTO;

export async function POST(request: NextRequest): Promise<NextResponse<RestoreResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const payload = validateBody(RestoreVerificationRequestSchema, await request.json());
    if (!payload.ok) return addHeaders(payload.error) as NextResponse;

    const result = await restoreVerificationEmail(payload.data);

    if ('verificationToken' in result) {
      const mailContext = buildVerificationMailContext(result.record, result.verificationToken, result.backupCode);
      await notificationService.sendEmailVerificationEmail(mailContext);

      return addHeaders(
        NextResponse.json({
          message: `Verification restored. It expires in ${getVerificationTokenTtlMinutes()} minutes.`,
          verification: { status: 'pending' },
        }),
      );
    }

    if (result.status === 'already_verified') {
      return addHeaders(
        NextResponse.json({ message: 'Email already verified', verification: { status: 'already_verified' } }),
      );
    }

    if (result.status === 'not_found') {
      return addHeaders(
        NextResponse.json(
          { message: 'Verification record not found', verification: { status: 'not_found' } },
          { status: 404 },
        ),
      );
    }

    return addHeaders(
      NextResponse.json({ message: 'Backup code expired', verification: { status: 'expired' } }, { status: 410 }),
    );
  } catch (error) {
    edgeLog('error', '/api/auth/email-verification/restore', 'Unhandled restore error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}

