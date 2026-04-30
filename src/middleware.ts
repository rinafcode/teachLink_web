import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRoutePermission } from './middleware/rbac';
import { UserRole } from './types/api';
import {
  API_DEPRECATION_HEADER,
  API_DEPRECATION_INFO_HEADER,
  API_ROOT,
  API_VERSION_HEADER,
  DEFAULT_API_VERSION,
  VERSIONED_API_ROOT,
} from './lib/apiVersioning';

export function middleware(request: NextRequest) {
  // In a real application, you would verify the JWT or session here
  // For this implementation, we'll check for a 'user-role' cookie or header
  const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
  const userRole = roleCookie || null;

  const permissionResponse = checkRoutePermission(request, userRole);
  if (permissionResponse) {
    return permissionResponse;
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith(API_ROOT)) {
    if (!pathname.startsWith(`${API_ROOT}/v`)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${VERSIONED_API_ROOT}${pathname.slice(API_ROOT.length)}`;
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set(API_VERSION_HEADER, DEFAULT_API_VERSION);
      response.headers.set(API_DEPRECATION_HEADER, 'true');
      response.headers.set(
        API_DEPRECATION_INFO_HEADER,
        `This endpoint is deprecated. Use ${VERSIONED_API_ROOT}${pathname.slice(
          API_ROOT.length,
        )} instead.`,
      );
      return response;
    }

    const response = NextResponse.next();
    response.headers.set(API_VERSION_HEADER, pathname.split('/')[2] || DEFAULT_API_VERSION);
    return response;
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/:path*',
  ],
};
