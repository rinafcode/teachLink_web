import { SignJWT } from 'jose';
import { UserRole } from '@/types/api';

export interface JWTPayload {
  sub: string;
  role: UserRole;
  email?: string;
  iat?: number;
  exp?: number;
  nbf?: number;
}

/** Distinct reasons a token can fail verification, for logging/monitoring. */
export type TokenFailureReason =
  | 'missing'
  | 'malformed'
  | 'no_secret'
  | 'bad_signature'
  | 'expired'
  | 'not_yet_valid'
  | 'invalid_role';

export interface TokenVerification {
  valid: boolean;
  payload?: JWTPayload;
  reason?: TokenFailureReason;
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
};

/**
 * Signs a new JWT for the given payload. Uses the `jose` library (Node runtime).
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verifies a JWT token and returns its payload.
 * Uses the Web Crypto API (Edge-compatible, works in Next.js middleware).
 */
export async function verifyToken(token: string | undefined | null): Promise<JWTPayload | null> {
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureBytes = base64UrlDecode(signatureB64).buffer as ArrayBuffer;
    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as ArrayBuffer,
      dataToVerify,
    );
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as JWTPayload;

    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    const validRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.INSTRUCTOR,
      UserRole.STUDENT,
      UserRole.GUEST,
    ];
    if (!validRoles.includes(payload.role)) return null;

    return payload;
  } catch {
    return null;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Decodes a JWT's payload **without verifying its signature**. Safe to call on
 * the client (no secret required) — used only to read non-sensitive claims such
 * as `exp` for scheduling a refresh. Never trust the result for authorization.
 */
export function decodeTokenPayload(token: string | undefined | null): JWTPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = new TextDecoder().decode(base64UrlDecode(parts[1]));
    return JSON.parse(json) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Like {@link verifyToken}, but returns a structured result that distinguishes
 * *why* verification failed (expired vs. not-yet-valid vs. bad signature, …) so
 * callers can log/monitor the specific reason instead of a bare `null`.
 */
export async function verifyTokenDetailed(
  token: string | undefined | null,
): Promise<TokenVerification> {
  if (!token) return { valid: false, reason: 'missing' };

  const secret = process.env.JWT_SECRET;
  if (!secret) return { valid: false, reason: 'no_secret' };

  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureBytes = base64UrlDecode(signatureB64).buffer as ArrayBuffer;
    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataToVerify);
    if (!isValid) return { valid: false, reason: 'bad_signature' };

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as JWTPayload;

    const nowSeconds = Date.now() / 1000;
    if (payload.exp && nowSeconds > payload.exp) {
      return { valid: false, payload, reason: 'expired' };
    }
    if (payload.nbf && nowSeconds < payload.nbf) {
      return { valid: false, payload, reason: 'not_yet_valid' };
    }

    const validRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.INSTRUCTOR,
      UserRole.STUDENT,
      UserRole.GUEST,
    ];
    if (!validRoles.includes(payload.role)) {
      return { valid: false, payload, reason: 'invalid_role' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}
