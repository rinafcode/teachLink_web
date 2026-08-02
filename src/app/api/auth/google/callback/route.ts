import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { exchangeCodeForToken, getGoogleUser, getGoogleAvatarUrl } from '@/lib/google/oauth';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth2 callback and creates/updates user session
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  edgeLog('info', '/api/auth/google/callback', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      edgeLog('error', '/api/auth/google/callback', `OAuth error: ${error}`);
      return addHeaders(
        NextResponse.json({ message: `Google OAuth error: ${error}` }, { status: 400 }),
      ) as NextResponse;
    }

    if (!code) {
      return addHeaders(
        NextResponse.json({ message: 'Authorization code is required' }, { status: 400 }),
      ) as NextResponse;
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get('google_oauth_state')?.value;
    if (!state || state !== storedState) {
      edgeLog('error', '/api/auth/google/callback', 'Invalid state parameter');
      return addHeaders(
        NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 }),
      ) as NextResponse;
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get Google user information
    const googleUser = await getGoogleUser(tokenResponse.access_token);

    // Validate that user has email
    if (!googleUser.email) {
      return addHeaders(
        NextResponse.json(
          { message: 'Google account must have an email' },
          { status: 400 },
        ),
      ) as NextResponse;
    }

    // Validate email is verified
    if (!googleUser.verified_email) {
      return addHeaders(
        NextResponse.json({ message: 'Google email must be verified' }, { status: 400 }),
      ) as NextResponse;
    }

    const mockUserId = Math.random().toString(36).substring(2, 9);
    const mockToken = `mock-jwt-token-${Date.now()}`;

    // Clear the state cookie
    const response = NextResponse.json(
      {
        message: 'Google authentication successful',
        user: {
          id: mockUserId,
          name: googleUser.name,
          email: googleUser.email,
          avatar: getGoogleAvatarUrl(googleUser),
          provider: 'google',
          providerId: googleUser.id,
        },
        token: mockToken,
      },
      { status: 200 },
    );

    // Clear the state cookie
    response.cookies.delete('google_oauth_state');

    return addHeaders(response) as NextResponse;
  } catch (error) {
    edgeLog('error', '/api/auth/google/callback', `Error: ${error}`);
    console.error('Google OAuth callback error:', error);

    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    ) as NextResponse;
  }
}
