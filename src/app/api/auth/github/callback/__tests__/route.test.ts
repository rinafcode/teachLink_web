import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/lib/github/oauth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github/oauth')>();
  return {
    ...actual,
    exchangeCodeForToken: vi.fn(),
    getGitHubUser: vi.fn(),
    getGitHubAvatarUrl: vi.fn(() => 'https://example.com/avatar.png'),
  };
});

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
    headers: new Headers(),
    cookies: {
      get: vi.fn((name: string) => {
        if (name === 'github_oauth_state') return { value: 'test_state' };
        return undefined;
      }),
      delete: vi.fn(),
    },
  } as any;
}

const CALLBACK_URL = 'http://localhost:3000/api/auth/github/callback';

describe('GitHub OAuth Callback API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/github/callback', () => {
    it('should handle a successful GitHub OAuth callback', async () => {
      const { exchangeCodeForToken, getGitHubUser } = await import('@/lib/github/oauth');

      (exchangeCodeForToken as any).mockResolvedValueOnce({
        access_token: 'test_access_token',
        token_type: 'Bearer',
        scope: 'read:user user:email',
      });

      (getGitHubUser as any).mockResolvedValueOnce({
        id: 123456789,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      });

      const response = await GET(createRequest(`${CALLBACK_URL}?code=test_code&state=test_state`));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('GitHub authentication successful');
      expect(json.user).toBeTruthy();
      expect(json.user.email).toBe('test@example.com');
      expect(json.user.provider).toBe('github');
      expect(json.token).toBeTruthy();
    });

    it('should reject a callback with a mismatched state parameter', async () => {
      const response = await GET(createRequest(`${CALLBACK_URL}?code=test_code&state=wrong_state`));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Invalid state parameter');
    });

    it('should reject a callback with a missing state parameter', async () => {
      const response = await GET(createRequest(`${CALLBACK_URL}?code=test_code`));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Invalid state parameter');
    });

    it('should handle an OAuth error from GitHub', async () => {
      const response = await GET(createRequest(`${CALLBACK_URL}?error=access_denied`));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toContain('GitHub OAuth error');
    });

    it('should handle a missing authorization code', async () => {
      const response = await GET(createRequest(`${CALLBACK_URL}?state=test_state`));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Authorization code is required');
    });

    it('should reject a GitHub account without a verified email', async () => {
      const { exchangeCodeForToken, getGitHubUser } = await import('@/lib/github/oauth');

      (exchangeCodeForToken as any).mockResolvedValueOnce({
        access_token: 'test_access_token',
        token_type: 'Bearer',
        scope: 'read:user user:email',
      });

      (getGitHubUser as any).mockResolvedValueOnce({
        id: 123456789,
        login: 'testuser',
        name: 'Test User',
        email: null,
      });

      const response = await GET(createRequest(`${CALLBACK_URL}?code=test_code&state=test_state`));

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('GitHub account must have a verified email');
    });
  });
});
