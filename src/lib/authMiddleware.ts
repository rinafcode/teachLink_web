import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole } from '@/types/api';

/**
 * Validates the Authorization header and returns a 401 response if missing or invalid.
 * Usage: const unauth = requireAuth(request); if (unauth) return unauth;
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (!token) {
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
