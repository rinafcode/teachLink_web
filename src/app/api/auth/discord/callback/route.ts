import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { exchangeCodeForToken, getDiscordUser, getDiscordAvatarUrl } from '@/lib/discord/oauth';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * GET /api/auth/discord/callback
 * Handles Discord OAuth2 callback and creates/updates user session
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  edgeLog('info', '/api/auth/discord/callback', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      edgeLog('error', '/api/auth/discord/callback', `OAuth error: ${error}`);
      return addHeaders(
        NextResponse.json({ message: `Discord OAuth error: ${error}` }, { status: 400 }),
      ) as NextResponse;
    }

    if (!code) {
      return addHeaders(
        NextResponse.json({ message: 'Authorization code is required' }, { status: 400 }),
      ) as NextResponse;
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get('discord_oauth_state')?.value;
    if (!state || state !== storedState) {
      edgeLog('error', '/api/auth/discord/callback', 'Invalid state parameter');
      return addHeaders(
        NextResponse.json({ message: 'Invalid state parameter' }, { status: 400 }),
      ) as NextResponse;
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get Discord user information
    const discordUser = await getDiscordUser(tokenResponse.access_token);

    // Validate that user has email
    if (!discordUser.email) {
      return addHeaders(
        NextResponse.json(
          { message: 'Discord account must have a verified email' },
          { status: 400 },
        ),
      ) as NextResponse;
    }

    // Validate email is verified
    if (!discordUser.verified) {
      return addHeaders(
        NextResponse.json({ message: 'Discord email must be verified' }, { status: 400 }),
      ) as NextResponse;
    }

    // In a real implementation, you would:
    // 1. Check if user exists in your database by Discord ID or email
    // 2. If exists, update their Discord info and generate a new token
    // 3. If not exists, create a new user account
    // 4. Store the Discord access/refresh tokens for future API calls
    // For now, we'll create a mock response

    const mockUserId = Math.random().toString(36).substring(2, 9);
    const mockToken = `mock-jwt-token-${Date.now()}`;

    // Clear the state cookie
    const response = NextResponse.json(
      {
        message: 'Discord authentication successful',
        user: {
          id: mockUserId,
          name: discordUser.username,
          email: discordUser.email,
          avatar: getDiscordAvatarUrl(discordUser),
          provider: 'discord',
          providerId: discordUser.id,
        },
        token: mockToken,
      },
      { status: 200 },
    );

    // Clear the state cookie
    response.cookies.delete('discord_oauth_state');

    return addHeaders(response) as NextResponse;
  } catch (error) {
    edgeLog('error', '/api/auth/discord/callback', `Error: ${error}`);
    console.error('Discord OAuth callback error:', error);

    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    ) as NextResponse;
  }
}
