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
  generateState: vi.fn(() => 'test_state_123'),
  getDiscordAuthUrl: vi.fn(() => 'https://discord.com/oauth2/authorize?test=param'),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

describe('Discord OAuth API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/discord', () => {
    it('should redirect to Discord authorization URL', async () => {
      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/auth/discord'),
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.get('location')).toBe('https://discord.com/oauth2/authorize?test=param');
    });

    it('should set state cookie', async () => {
      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/auth/discord'),
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const cookies = response.headers.get('set-cookie');

      expect(cookies).toBeTruthy();
      expect(cookies).toContain('discord_oauth_state=test_state_123');
    });

    it('should handle missing OAuth configuration', async () => {
      const { getDiscordAuthUrl } = await import('@/lib/discord/oauth');
      (getDiscordAuthUrl as any).mockImplementationOnce(() => {
        throw new Error('Discord OAuth configuration is missing');
      });

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/auth/discord'),
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.message).toBe('Failed to initiate Discord OAuth');
    });
  });
});
