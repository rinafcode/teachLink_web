import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { generateState, getGoogleAuthUrl } from '@/lib/google/oauth';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * GET /api/auth/google
 * Initiates Google OAuth2 flow by redirecting to Google's authorization page
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  edgeLog('info', '/api/auth/google', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const state = generateState();
    const authUrl = getGoogleAuthUrl(state);

    // Store state in a cookie for verification during callback
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    return addHeaders(response) as NextResponse;
  } catch (error) {
    edgeLog('error', '/api/auth/google', `Error: ${error}`);

    return addHeaders(
      NextResponse.json({ message: 'Failed to initiate Google OAuth' }, { status: 500 }),
    ) as NextResponse;
  }
}
