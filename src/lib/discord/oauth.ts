/**
 * Discord OAuth2 Integration
 * Handles Discord OAuth2 flow for authentication
 */

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  verified: boolean;
  locale: string;
  flags: number;
  premium_type: number;
  public_flags: number;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Get Discord OAuth authorization URL
 */
export function getDiscordAuthUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const scope = 'identify email';

  if (!clientId || !redirectUri) {
    throw new Error('Discord OAuth configuration is missing');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  });

  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Discord OAuth configuration is missing');
  }

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Get Discord user information using access token
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Discord user: ${error}`);
  }

  return response.json();
}

/**
 * Generate a random state parameter for OAuth
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get Discord avatar URL
 */
export function getDiscordAvatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  // Return default avatar based on discriminator
  const defaultAvatarIndex = parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
}
