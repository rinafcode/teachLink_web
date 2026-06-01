import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDiscordAuthUrl,
  generateState,
  getDiscordAvatarUrl,
} from '../oauth';

// Mock environment variables
const mockEnv = {
  DISCORD_CLIENT_ID: 'test_client_id',
  DISCORD_REDIRECT_URI: 'http://localhost:3000/api/auth/discord/callback',
};

describe('Discord OAuth Utilities', () => {
  beforeEach(() => {
    // Reset environment mocks
    process.env.DISCORD_CLIENT_ID = mockEnv.DISCORD_CLIENT_ID;
    process.env.DISCORD_REDIRECT_URI = mockEnv.DISCORD_REDIRECT_URI;
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
      expect(state1.length).toBeGreaterThan(10);
    });
  });

  describe('getDiscordAuthUrl', () => {
    it('should generate correct Discord authorization URL', () => {
      const state = 'test_state_123';
      const url = getDiscordAuthUrl(state);

      expect(url).toContain('https://discord.com/api/v10/oauth2/authorize');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('redirect_uri=' + encodeURIComponent(mockEnv.DISCORD_REDIRECT_URI));
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=identify%20email');
      expect(url).toContain(`state=${state}`);
    });

    it('should throw error when DISCORD_CLIENT_ID is missing', () => {
      process.env.DISCORD_CLIENT_ID = '';
      expect(() => getDiscordAuthUrl('test_state')).toThrow('Discord OAuth configuration is missing');
    });

    it('should throw error when DISCORD_REDIRECT_URI is missing', () => {
      process.env.DISCORD_REDIRECT_URI = '';
      expect(() => getDiscordAuthUrl('test_state')).toThrow('Discord OAuth configuration is missing');
    });
  });

  describe('getDiscordAvatarUrl', () => {
    it('should return custom avatar URL when user has avatar', () => {
      const user = {
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        avatar: 'abcdef123456',
        email: 'test@example.com',
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      };

      const avatarUrl = getDiscordAvatarUrl(user);
      expect(avatarUrl).toBe('https://cdn.discordapp.com/avatars/123456789/abcdef123456.png');
    });

    it('should return default avatar URL when user has no avatar', () => {
      const user = {
        id: '123456789',
        username: 'testuser',
        discriminator: '0001',
        avatar: null,
        email: 'test@example.com',
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      };

      const avatarUrl = getDiscordAvatarUrl(user);
      expect(avatarUrl).toBe('https://cdn.discordapp.com/embed/avatars/1.png');
    });

    it('should calculate correct default avatar based on discriminator', () => {
      const user1 = {
        id: '123456789',
        username: 'testuser',
        discriminator: '0000',
        avatar: null,
        email: 'test@example.com',
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      };

      const user2 = {
        id: '123456789',
        username: 'testuser',
        discriminator: '0004',
        avatar: null,
        email: 'test@example.com',
        verified: true,
        locale: 'en-US',
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      };

      expect(getDiscordAvatarUrl(user1)).toBe('https://cdn.discordapp.com/embed/avatars/0.png');
      expect(getDiscordAvatarUrl(user2)).toBe('https://cdn.discordapp.com/embed/avatars/4.png');
    });
  });
});
