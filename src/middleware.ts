import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRoutePermission } from './middleware/rbac';
import { applySecurityHeaders } from './middleware/security';
import { applyCspHeaders } from './middleware/csp';
import { handleRedirects } from './middleware/redirectManagement';
import { UserRole } from './types/api';
import {
  API_DEPRECATION_HEADER,
  API_DEPRECATION_INFO_HEADER,
  API_ROOT,
  API_VERSION_HEADER,
  DEFAULT_API_VERSION,
  VERSIONED_API_ROOT,
  INTERNAL_API_REQUEST_HEADER,
} from './lib/apiVersioning';

export function middleware(request: NextRequest) {
  const traceId = crypto.randomUUID();
  request.headers.set('x-trace-id', traceId);

  // Handle redirects first (early in the chain)
  const redirectResponse = handleRedirects(request);
  if (redirectResponse) {
    redirectResponse.headers.set('x-trace-id', traceId);
    return redirectResponse;
  }

  const roleCookie = request.cookies.get('user-role')?.value as UserRole | undefined;
  const userRole = roleCookie || null;

  const withHeaders = (response: NextResponse) => {
    response.headers.set('x-trace-id', traceId);
    const withSecurity = applySecurityHeaders(response, request);
    return applyCspHeaders(withSecurity, request);
  };

  const permissionResponse = checkRoutePermission(request, userRole);
  if (permissionResponse) return withHeaders(permissionResponse);

  const { pathname } = request.nextUrl;
  if (pathname.startsWith(API_ROOT)) {
    if (request.headers.get(INTERNAL_API_REQUEST_HEADER) === 'true') {
      const response = NextResponse.next();
      response.headers.set(API_VERSION_HEADER, DEFAULT_API_VERSION);
      return withHeaders(response);
    }

    if (!pathname.startsWith(`${API_ROOT}/v`)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${VERSIONED_API_ROOT}${pathname.slice(API_ROOT.length)}`;
      const response = NextResponse.rewrite(rewriteUrl.toString());
      response.headers.set(API_VERSION_HEADER, DEFAULT_API_VERSION);
      response.headers.set(API_DEPRECATION_HEADER, 'true');
      response.headers.set(
        API_DEPRECATION_INFO_HEADER,
        `This endpoint is deprecated. Use ${VERSIONED_API_ROOT}${pathname.slice(
          API_ROOT.length,
        )} instead.`,
      );
      return withHeaders(response);
    }

    // Fix for #726 — validate version string before use
    const extractedVersion = pathname.split('/')[2];
    if (!extractedVersion || !/^v\d+$/.test(extractedVersion)) {
      return withHeaders(new NextResponse('Invalid API version', { status: 400 }));
    }
    const response = NextResponse.next();
    response.headers.set(API_VERSION_HEADER, extractedVersion);
    return withHeaders(response);
  }

  return withHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/editor/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/:path*',
  ],
};
