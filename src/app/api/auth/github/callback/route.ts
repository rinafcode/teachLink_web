import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { exchangeCodeForToken, getGitHubUser, getGitHubAvatarUrl } from '@/lib/github/oauth';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * GET /api/auth/github/callback
 * Handles GitHub OAuth2 callback and creates/updates user session
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  edgeLog('info', '/api/auth/github/callback', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      edgeLog('error', '/api/auth/github/callback', `OAuth error: ${error}`);
      return addHeaders(
        NextResponse.json({ message: `GitHub OAuth error: ${error}` }, { status: 400 }),
      ) as NextResponse;
    }

    if (!code) {
      return addHeaders(
        NextResponse.json({ message: 'Authorization code is required' }, { status: 400 }),
      ) as NextResponse;
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get('github_oauth_state')?.value;
    if (!state || state !== storedState) {
      edgeLog('error', '/api/auth/github/callback', 'Invalid state parameter');
      return addHeaders(
        NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 }),
      ) as NextResponse;
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get GitHub user information
    const githubUser = await getGitHubUser(tokenResponse.access_token);

    // Validate that user has email
    if (!githubUser.email) {
      return addHeaders(
        NextResponse.json(
          { message: 'GitHub account must have a verified email' },
          { status: 400 },
        ),
      ) as NextResponse;
    }

    const mockUserId = Math.random().toString(36).substring(2, 9);
    const mockToken = `mock-jwt-token-${Date.now()}`;

    // Clear the state cookie
    const response = NextResponse.json(
      {
        message: 'GitHub authentication successful',
        user: {
          id: mockUserId,
          name: githubUser.name || githubUser.login,
          email: githubUser.email,
          avatar: getGitHubAvatarUrl(githubUser),
          provider: 'github',
          providerId: String(githubUser.id),
        },
        token: mockToken,
      },
      { status: 200 },
    );

    // Clear the state cookie
    response.cookies.delete('github_oauth_state');

    return addHeaders(response) as NextResponse;
  } catch (error) {
    edgeLog('error', '/api/auth/github/callback', `Error: ${error}`);
    console.error('GitHub OAuth callback error:', error);

    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    ) as NextResponse;
  }
}
