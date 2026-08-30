import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { constantTimeEqual, verifyToken, verifyTokenDetailed } from '../jwt';

const SECRET = 'test-jwt-secret';
const USER_ROLE = 'STUDENT' as const;

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signTokenWithSecret(payload: Record<string, unknown>): Promise<string> {
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

describe('constantTimeEqual', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeEqual('hello', 'hello')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(constantTimeEqual('hello', 'world')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(constantTimeEqual('hello', 'helloo')).toBe(false);
    expect(constantTimeEqual('hello', 'hell')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });

  it('returns false when one string is empty', () => {
    expect(constantTimeEqual('', 'a')).toBe(false);
    expect(constantTimeEqual('a', '')).toBe(false);
  });

  it('works with hex-encoded hash strings', () => {
    const hash1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2';
    const hash2 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2';
    const hash3 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f3';

    expect(constantTimeEqual(hash1, hash2)).toBe(true);
    expect(constantTimeEqual(hash1, hash3)).toBe(false);
  });

  it('returns false for strings that differ only in the last character', () => {
    expect(constantTimeEqual('aaaa', 'aaab')).toBe(false);
  });

  it('returns false for strings that differ only in the first character', () => {
    expect(constantTimeEqual('aaaa', 'baaa')).toBe(false);
  });

  it('handles strings with special characters', () => {
    expect(constantTimeEqual('hello world!', 'hello world!')).toBe(true);
    expect(constantTimeEqual('hello world!', 'hello world?')).toBe(false);
  });

  it('handles strings with different byte lengths (unicode)', () => {
    // héllo has a multi-byte UTF-8 char, making it different byte-length than hello
    expect(constantTimeEqual('héllo', 'héllo')).toBe(true);
    expect(constantTimeEqual('héllo', 'hello')).toBe(false);
  });
});

describe('JWT clock skew tolerance', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    process.env.JWT_CLOCK_SKEW_MS = '5000';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_CLOCK_SKEW_MS;
  });

  it('accepts exp and nbf timestamps within the configured leeway', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const expiredSoon = await signTokenWithSecret({
      sub: 'user-1',
      role: USER_ROLE,
      iat: nowSeconds - 10,
      exp: nowSeconds - 2,
    });

    const notYetValid = await signTokenWithSecret({
      sub: 'user-2',
      role: USER_ROLE,
      iat: nowSeconds - 10,
      nbf: nowSeconds + 2,
    });

    await expect(verifyToken(expiredSoon)).resolves.not.toBeNull();
    await expect(verifyToken(notYetValid)).resolves.not.toBeNull();

    await expect(verifyTokenDetailed(expiredSoon)).resolves.toMatchObject({ valid: true });
    await expect(verifyTokenDetailed(notYetValid)).resolves.toMatchObject({ valid: true });
  });

  it('rejects tokens beyond the allowed skew window', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const expiredFarPast = await signTokenWithSecret({
      sub: 'user-3',
      role: USER_ROLE,
      iat: nowSeconds - 60,
      exp: nowSeconds - 10,
    });

    const notYetValidFarFuture = await signTokenWithSecret({
      sub: 'user-4',
      role: USER_ROLE,
      iat: nowSeconds - 60,
      nbf: nowSeconds + 10,
    });

    await expect(verifyToken(expiredFarPast)).resolves.toBeNull();
    await expect(verifyToken(notYetValidFarFuture)).resolves.toBeNull();

    await expect(verifyTokenDetailed(expiredFarPast)).resolves.toMatchObject({ valid: false, reason: 'expired' });
    await expect(verifyTokenDetailed(notYetValidFarFuture)).resolves.toMatchObject({ valid: false, reason: 'not_yet_valid' });
  });
});
