/**
 * GitHub OAuth2 Integration
 * Handles GitHub OAuth2 flow for authentication
 */

import { generateOAuthState, validateOAuthState } from '@/middleware/security';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  company: string | null;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

/**
 * Get GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  const scope = 'read:user user:email';

  if (!clientId || !redirectUri) {
    throw new Error('GitHub OAuth configuration is missing');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `${GITHUB_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('GitHub OAuth configuration is missing');
  }

  const response = await fetch(`${GITHUB_OAUTH_BASE}/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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
 * Get GitHub user information using access token
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch GitHub user: ${error}`);
  }

  const user = await response.json();

  // If user doesn't have public email, fetch primary email
  if (!user.email) {
    const emailResponse = await fetch(`${GITHUB_API_BASE}/user/emails`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      if (primaryEmail) {
        user.email = primaryEmail.email;
      }
    }
  }

  return user;
}

/**
 * Generate a random state parameter for OAuth
 *
 * The value is drawn from the CSPRNG so it cannot be predicted or replayed by
 * an attacker, which is the guarantee the OAuth `state` parameter exists for.
 */
export function generateState(): string {
  return generateOAuthState();
}

/**
 * Verify an OAuth `state` supplied on the callback against the value stored
 * when the flow started. Guards the exchange against login CSRF.
 */
export function validateState(actual?: string, expected?: string): boolean {
  return validateOAuthState(actual, expected);
}

/**
 * Get GitHub avatar URL
 */
export function getGitHubAvatarUrl(user: GitHubUser): string {
  return user.avatar_url || '';
}
