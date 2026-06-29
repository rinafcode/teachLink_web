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

export async function middleware(request: NextRequest) {
  const traceId = crypto.randomUUID();
  request.headers.set('x-trace-id', traceId);

  // Handle redirects first (early in the chain)
  const redirectResponse = handleRedirects(request);
  if (redirectResponse) {
    redirectResponse.headers.set('x-trace-id', traceId);
    return redirectResponse;
  }

  // In a real application, you would verify the JWT or session here.
  // Verify JWT from Authorization header or cookie — never trust client-supplied role cookies
  const token =
    request.headers.get('Authorization')?.replace('Bearer ', '') ??
    request.cookies.get('Authorization')?.value;
  const { verifyToken } = await import('./lib/auth/jwt');
  const payload = await verifyToken(token);
  const userRole = payload?.role ?? null;

  const withHeaders = (response: NextResponse) => {
    response.headers.set('x-trace-id', traceId);
    const withSecurity = applySecurityHeaders(response, request);
    return applyCspHeaders(withSecurity, request);
  };

  const permissionResponse = checkRoutePermission(request, userRole);
  if (permissionResponse) {
    return withHeaders(permissionResponse);
  }

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

    const response = NextResponse.next();
    response.headers.set(API_VERSION_HEADER, pathname.split('/')[2] || DEFAULT_API_VERSION);
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
