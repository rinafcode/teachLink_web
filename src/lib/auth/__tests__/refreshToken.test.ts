import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  verifyRefreshToken,
  signRefreshToken,
  updateRotationSequence,
  getLatestRotationSequence,
  clearRotationSequenceStore,
} from '../jwt';

const SECRET = 'test-jwt-secret';
const USER_ROLE = 'STUDENT' as const;

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signRefreshTokenWithSecret(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${unsigned}.${signatureB64}`;
}

describe('Refresh token reuse detection', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    process.env.JWT_CLOCK_SKEW_MS = '5000';
    clearRotationSequenceStore();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_CLOCK_SKEW_MS;
  });

  describe('verifyRefreshToken', () => {
    it('returns null for missing token', async () => {
      const result = await verifyRefreshToken(null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('missing');
    });

    it('returns null for malformed token', async () => {
      const result = await verifyRefreshToken('not-a-jwt');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('malformed');
    });

    it('rejects tokens with invalid signature', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      // Tamper with the token
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.dGVzdA.${parts[2]}`;
      const result = await verifyRefreshToken(tamperedToken);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('bad_signature');
    });

    it('accepts valid refresh token with correct rotation sequence', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.family).toBe('family-1');
      expect(result.payload?.rotationSequence).toBe(0);
    });

    it('rejects refresh token with reused rotation sequence', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      
      // First token with sequence 0
      const token1 = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      // Simulate successful refresh by updating sequence to 1
      updateRotationSequence('family-1', 1);

      // Try to use the old token (reuse attempt)
      const result = await verifyRefreshToken(token1);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('refresh_token_reuse_detected');
    });

    it('accepts refresh token with current rotation sequence', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      
      // Set up sequence at 0
      updateRotationSequence('family-1', 0);

      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(true);
    });

    it('rejects refresh token without family claim', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('malformed');
    });

    it('rejects refresh token without rotationSequence claim', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('malformed');
    });

    it('rejects expired refresh token', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 3600,
        exp: nowSeconds - 10,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('rejects refresh token with invalid role', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: 'INVALID_ROLE',
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds - 10,
        exp: nowSeconds + 3600,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_role');
    });
  });

  describe('rotation sequence management', () => {
    it('tracks rotation sequences per family', () => {
      updateRotationSequence('family-1', 0);
      updateRotationSequence('family-2', 5);

      expect(getLatestRotationSequence('family-1')).toBe(0);
      expect(getLatestRotationSequence('family-2')).toBe(5);
    });

    it('returns -1 for unknown families', () => {
      expect(getLatestRotationSequence('unknown-family')).toBe(-1);
    });

    it('updates existing sequence', () => {
      updateRotationSequence('family-1', 0);
      updateRotationSequence('family-1', 1);
      updateRotationSequence('family-1', 2);

      expect(getLatestRotationSequence('family-1')).toBe(2);
    });

    it('clears all sequences', () => {
      updateRotationSequence('family-1', 0);
      updateRotationSequence('family-2', 5);

      clearRotationSequenceStore();

      expect(getLatestRotationSequence('family-1')).toBe(-1);
      expect(getLatestRotationSequence('family-2')).toBe(-1);
    });
  });

  describe('signRefreshToken', () => {
    it('creates a valid refresh token', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const token = await signRefreshTokenWithSecret({
        sub: 'user-1',
        role: USER_ROLE,
        family: 'family-1',
        rotationSequence: 0,
        iat: nowSeconds,
        exp: nowSeconds + 30 * 24 * 60 * 60,
      });

      const result = await verifyRefreshToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('user-1');
      expect(result.payload?.role).toBe(USER_ROLE);
      expect(result.payload?.family).toBe('family-1');
      expect(result.payload?.rotationSequence).toBe(0);
    });
  });
});