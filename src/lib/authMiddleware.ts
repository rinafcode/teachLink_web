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
  // Try to get user from Bearer token (JWT would be validated in production)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // In production, this would decode and verify the JWT
    // For now, we'll use the token as userId and check role from cookie
    const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
    if (roleCookie) {
      return {
        id: token,
        email: '',
        role: roleCookie,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Fallback to cookie-based auth (for development/testing)
  const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
  if (roleCookie) {
    return {
      id: 'cookie-user',
      email: '',
      role: roleCookie,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}
