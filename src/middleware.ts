import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRoutePermission } from './middleware/rbac';
import { UserRole } from './types/api';

export function middleware(request: NextRequest) {
  // In a real application, you would verify the JWT or session here
  // For this implementation, we'll check for a 'user-role' cookie or header
  const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
  const userRole = roleCookie || null;

  const permissionResponse = checkRoutePermission(request, userRole);
  if (permissionResponse) {
    return permissionResponse;
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/instructor/:path*', '/dashboard/:path*', '/profile/:path*'],
};
