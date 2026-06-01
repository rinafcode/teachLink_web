import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the dependencies
vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/lib/discord/oauth', () => ({
  exchangeCodeForToken: vi.fn(),
  getDiscordUser: vi.fn(),
  getDiscordAvatarUrl: vi.fn(() => 'https://example.com/avatar.png'),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

describe('Discord OAuth Callback API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/discord/callback', () => {
    it('should handle successful Discord OAuth callback', async () => {
      const { exchangeCodeForToken, getDiscordUser } = await import('@/lib/discord/oauth');

      (exchangeCodeForToken as any).mockResolvedValueOnce({
        access_token: 'test_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test_refresh_token',
        scope: 'identify email',
      });

      (getDiscordUser as any).mockResolvedValueOnce({
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        avatar: 'avatar_hash',
        email: 'test@example.com',
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      });

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/auth/discord/callback?code=test_code&state=test_state',
        ),
        headers: new Headers(),
        cookies: {
          get: vi.fn((name: string) => {
            if (name === 'discord_oauth_state') return { value: 'test_state' };
            return undefined;
          }),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Discord authentication successful');
      expect(json.user).toBeTruthy();
      expect(json.user.email).toBe('test@example.com');
      expect(json.token).toBeTruthy();
    });

    it('should handle OAuth error from Discord', async () => {
      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/auth/discord/callback?error=access_denied'),
        headers: new Headers(),
        cookies: {
          get: vi.fn(),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toContain('Discord OAuth error');
    });

    it('should handle missing authorization code', async () => {
      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/auth/discord/callback'),
        headers: new Headers(),
        cookies: {
          get: vi.fn(),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Authorization code is required');
    });

    it('should validate state parameter', async () => {
      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/auth/discord/callback?code=test_code&state=wrong_state',
        ),
        headers: new Headers(),
        cookies: {
          get: vi.fn((name: string) => {
            if (name === 'discord_oauth_state') return { value: 'correct_state' };
            return undefined;
          }),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Invalid state parameter');
    });

    it('should reject unverified Discord email', async () => {
      const { exchangeCodeForToken, getDiscordUser } = await import('@/lib/discord/oauth');

      (exchangeCodeForToken as any).mockResolvedValueOnce({
        access_token: 'test_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test_refresh_token',
        scope: 'identify email',
      });

      (getDiscordUser as any).mockResolvedValueOnce({
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        avatar: 'avatar_hash',
        email: 'test@example.com',
        verified: false, // Unverified email
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      });

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/auth/discord/callback?code=test_code&state=test_state',
        ),
        headers: new Headers(),
        cookies: {
          get: vi.fn((name: string) => {
            if (name === 'discord_oauth_state') return { value: 'test_state' };
            return undefined;
          }),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Discord email must be verified');
    });

    it('should handle missing Discord email', async () => {
      const { exchangeCodeForToken, getDiscordUser } = await import('@/lib/discord/oauth');

      (exchangeCodeForToken as any).mockResolvedValueOnce({
        access_token: 'test_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test_refresh_token',
        scope: 'identify email',
      });

      (getDiscordUser as any).mockResolvedValueOnce({
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        avatar: 'avatar_hash',
        email: null, // Missing email
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      });

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/auth/discord/callback?code=test_code&state=test_state',
        ),
        headers: new Headers(),
        cookies: {
          get: vi.fn((name: string) => {
            if (name === 'discord_oauth_state') return { value: 'test_state' };
            return undefined;
          }),
          delete: vi.fn(),
        },
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toBe('Discord account must have a verified email');
    });
  });
});
