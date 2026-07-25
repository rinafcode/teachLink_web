/**
 * Google OAuth2 Integration
 * Handles Google OAuth2 flow for authentication
 */

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
}

const GOOGLE_API_BASE = 'https://www.googleapis.com';
const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2';

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = 'openid email profile';

  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth configuration is missing');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${GOOGLE_OAUTH_BASE}/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth configuration is missing');
  }

  const response = await fetch(`${GOOGLE_API_BASE}/oauth2/v4/token`, {
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
 * Get Google user information using access token
 */
export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(`${GOOGLE_API_BASE}/oauth2/v2/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Google user: ${error}`);
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
 * Get Google avatar URL
 */
export function getGoogleAvatarUrl(user: GoogleUser): string {
  return user.picture || '';
}
