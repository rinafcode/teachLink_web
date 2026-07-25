import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateReferralCode, referralCodeExists } from '@/lib/referral';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// GET /api/referral/validate?code=XXXX
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const route = '/api/referral/validate';
  edgeLog('info', route, 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      edgeLog('warn', route, 'Validation failed', { reason: 'missing_code' });
      return addHeaders(
        NextResponse.json({ message: 'Referral code is required' }, { status: 400 }),
      );
    }

    // Validate format
    const formatValidation = validateReferralCode(code);
    if (!formatValidation.isValid) {
      edgeLog('warn', route, 'Validation failed', {
        reason: 'invalid_format',
        error: formatValidation.error,
      });
      return addHeaders(
        NextResponse.json(
          { message: formatValidation.error || 'Invalid referral code format' },
          { status: 400 },
        ),
      );
    }

    // Check if referral code exists
    const exists = referralCodeExists(code);
    if (!exists) {
      edgeLog('warn', route, 'Validation failed', { reason: 'code_not_found' });
      return addHeaders(
        NextResponse.json({ valid: false, message: 'Referral code not found' }, { status: 404 }),
      );
    }

    edgeLog('info', route, 'Referral code validated successfully', { code });
    return addHeaders(
      NextResponse.json({ valid: true, message: 'Referral code is valid' }, { status: 200 }),
    );
  } catch (error) {
    edgeLog('error', route, 'Unhandled validation error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return addHeaders(NextResponse.json({ message: 'Internal server error' }, { status: 500 }));
  }
}
