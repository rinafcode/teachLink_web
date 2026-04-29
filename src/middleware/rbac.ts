import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/types/api';

/**
 * Define which routes require which minimum roles.
 */
const ROUTE_PERMISSIONS: Record<string, UserRole> = {
  '/admin': UserRole.ADMIN,
  '/instructor': UserRole.INSTRUCTOR,
  '/dashboard': UserRole.STUDENT,
  '/profile': UserRole.STUDENT,
};

/**
 * RBAC Helper for Middleware
 */
export function checkRoutePermission(
  request: NextRequest,
  userRole: UserRole | null,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Find the required role for the current path
  const requiredRole = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    pathname.startsWith(path),
  )?.[1];

  if (!requiredRole) {
    return null; // No specific role required for this route
  }

  // If no user role is provided, they are probably not logged in
  if (!userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Hierarchy check
  const hierarchy = [UserRole.GUEST, UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN];
  const userRoleIndex = hierarchy.indexOf(userRole);
  const requiredRoleIndex = hierarchy.indexOf(requiredRole);

  if (userRoleIndex < requiredRoleIndex) {
    // Redirect to an unauthorized page or dashboard
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return null; // Access granted
}
