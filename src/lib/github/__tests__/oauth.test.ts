import { describe, it, expect, beforeEach } from 'vitest';
import { getGitHubAuthUrl, generateState, validateState, getGitHubAvatarUrl } from '../oauth';

const mockEnv = {
  GITHUB_CLIENT_ID: 'test_client_id',
  GITHUB_REDIRECT_URI: 'http://localhost:3000/api/auth/github/callback',
};

describe('GitHub OAuth Utilities', () => {
  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = mockEnv.GITHUB_CLIENT_ID;
    process.env.GITHUB_REDIRECT_URI = mockEnv.GITHUB_REDIRECT_URI;
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

    it('should produce an unpredictable, hex-encoded nonce with 256 bits of entropy', () => {
      expect(generateState()).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('validateState', () => {
    it('should accept a state matching the stored value', () => {
      expect(validateState('abc123', 'abc123')).toBe(true);
    });

    it('should reject a state that does not match the stored value', () => {
      expect(validateState('wrong', 'right')).toBe(false);
    });

    it('should reject missing state or stored value', () => {
      expect(validateState(undefined, 'stored')).toBe(false);
      expect(validateState('present', undefined)).toBe(false);
      expect(validateState(undefined, undefined)).toBe(false);
    });
  });

  describe('getGitHubAuthUrl', () => {
    it('should generate correct GitHub authorization URL', () => {
      const state = 'test_state_123';
      const url = getGitHubAuthUrl(state);
      const params = new URL(url).searchParams;

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(params.get('client_id')).toBe(mockEnv.GITHUB_CLIENT_ID);
      expect(params.get('redirect_uri')).toBe(mockEnv.GITHUB_REDIRECT_URI);
      expect(params.get('scope')).toBe('read:user user:email');
      expect(params.get('state')).toBe(state);
    });

    it('should throw error when GITHUB_CLIENT_ID is missing', () => {
      process.env.GITHUB_CLIENT_ID = '';
      expect(() => getGitHubAuthUrl('test_state')).toThrow('GitHub OAuth configuration is missing');
    });

    it('should throw error when GITHUB_REDIRECT_URI is missing', () => {
      process.env.GITHUB_REDIRECT_URI = '';
      expect(() => getGitHubAuthUrl('test_state')).toThrow('GitHub OAuth configuration is missing');
    });
  });

  describe('getGitHubAvatarUrl', () => {
    it('should return the avatar URL when present', () => {
      const user = {
        id: 1,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        html_url: 'https://github.com/testuser',
        bio: null,
        location: null,
        blog: null,
        twitter_username: null,
        company: null,
      };

      expect(getGitHubAvatarUrl(user)).toBe('https://avatars.githubusercontent.com/u/1?v=4');
    });

    it('should return an empty string when the user has no avatar', () => {
      const user = {
        id: 1,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: '',
        html_url: 'https://github.com/testuser',
        bio: null,
        location: null,
        blog: null,
        twitter_username: null,
        company: null,
      };

      expect(getGitHubAvatarUrl(user)).toBe('');
    });
  });
});
