import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole } from '@/types/api';
import { verifyToken } from '@/lib/auth/jwt';

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
export function getUserFromRequest(request: NextRequest): User | null {
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
