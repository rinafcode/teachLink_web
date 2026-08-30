import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole } from '@/types/api';
import { verifyToken } from '@/lib/auth/jwt';
import { checkIdentityRateLimit, resetIdentityRateLimit } from '@/lib/ratelimit';

/**
 * Checks for authentication via Bearer token or internal API secret.
 * Returns a 401 response if neither is valid, or null if authorized.
 * Usage: const unauth = requireAuth(request); if (unauth) return unauth;
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const internalToken = request.headers.get('x-internal-token');
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (internalToken && internalSecret && internalToken === internalSecret) {
    return null;
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

/**
 * Extract user from request using Bearer token or user-role cookie.
 * Returns null if user cannot be determined.
 */
// Narrow the returned type to only the fields this helper provides.
type AuthUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'referralCount'>;

/**
 * Per-identity (email) rate limit for failed login attempts.
 * Returns a 429 response if the identity has exceeded the allowed number of
 * failed attempts within the sliding window, or null if the attempt is allowed.
 */
export function checkLoginRateLimit(email: string): NextResponse | null {
  const { rateLimitResponse } = checkIdentityRateLimit(email, 'LOGIN_IDENTITY');
  return rateLimitResponse;
}

/**
 * Resets the per-identity login rate limit after a successful authentication
 * so the user's next batch of attempts starts with a fresh window.
 */
export function resetLoginRateLimit(email: string): void {
  resetIdentityRateLimit(email, 'LOGIN_IDENTITY');
}

export function getUserFromRequest(request: NextRequest): AuthUser | null {
  // Try to get user from Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
    if (roleCookie) {
      return {
        id: token,
        name: '',
        email: '',
        role: roleCookie,
        referralCount: 0,
      };
    }
  }

  // Fallback to cookie-based auth (for development/testing)
  const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
  if (roleCookie) {
    return {
      id: 'cookie-user',
      name: '',
      email: '',
      role: roleCookie,
      referralCount: 0,
    };
  }

  return null;
}