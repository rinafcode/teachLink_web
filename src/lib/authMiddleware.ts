import { NextRequest, NextResponse } from 'next/server';
import type { User, UserRole } from '@/types/api';
import { isAtLeast, hasPermission as checkPermission } from '@/lib/auth/acl';
import type { Permission } from '@/types/api';

/**
 * Checks for authentication via Bearer token or internal API secret.
 * Returns a 401 response if neither is valid, or null if authorized.
 * Usage: const unauth = requireAuth(request); if (unauth) return unauth;
 */
export function requireAuth(request: NextRequest): NextResponse | null {
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

  return null;
}

/**
 * Extracts user information from request headers.
 * If internal token matches secret, user is treated as ADMIN.
 * Otherwise, returns user from x-user-id/x-user-email headers with role from x-user-role.
 */
export function getUserFromRequest(request: NextRequest): User | null {
  const internalToken = request.headers.get('x-internal-token');
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (internalToken && internalSecret && internalToken === internalSecret) {
    return {
      id: 'internal-system',
      email: 'system@internal',
      role: 'ADMIN' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    };
  }

  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = (request.headers.get('x-user-role') || 'GUEST') as UserRole;
  const adminUser = request.headers.get('x-admin-user');

  if (adminUser || userId || userEmail) {
    return {
      id: userId || adminUser || 'unknown',
      email: userEmail || `${adminUser}@admin.local`,
      role: adminUser ? ('ADMIN' as UserRole) : userRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: adminUser ? true : false,
    };
  }

  return null;
}

/**
 * Check if user has at least the required role.
 * Usage: const forbidden = hasRoleOrForbidden(request, 'ADMIN'); if (forbidden) return forbidden;
 */
export function hasRoleOrForbidden(request: NextRequest, requiredRole: UserRole): NextResponse | null {
  const user = getUserFromRequest(request);
  if (!user || !isAtLeast(user, requiredRole)) {
    return forbidden();
  }
  return null;
}

/**
 * Check if user has a specific permission.
 * Usage: const forbidden = hasPermissionOrForbidden(request, Permission.SYSTEM_SETTINGS); if (forbidden) return forbidden;
 */
export function hasPermissionOrForbidden(request: NextRequest, permission: Permission): NextResponse | null {
  const user = getUserFromRequest(request);
  if (!user || !checkPermission(user, permission)) {
    return forbidden();
  }
  return null;
}

/**
 * Returns a 403 Forbidden response.
 */
export function forbidden(): NextResponse {
  return NextResponse.json(
    { message: 'Forbidden: Insufficient permissions' },
    { status: 403 },
  );
}
