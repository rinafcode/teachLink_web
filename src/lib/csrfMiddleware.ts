import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// CSRF Configuration
const CSRF_CONFIG = {
  cookieName: 'XSRF-TOKEN',
  headerName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: false, // Client needs to read it for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
  tokenLength: 32,
};

// Generate a cryptographically secure CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

// Get CSRF token from cookie
export function getCSRFTokenFromCookie(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_CONFIG.cookieName)?.value;
}

// Check if request is idempotent (safe method)
function isIdempotentMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

// Check if path is an auth endpoint (exempt from CSRF)
function isAuthEndpoint(pathname: string): boolean {
  const authPaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/auth/discord',
    '/api/auth/email-verification',
  ];
  return authPaths.some(path => pathname.startsWith(path));
}

// Validate CSRF token using timing-safe comparison
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Main CSRF middleware handler
export function csrfMiddleware(request: NextRequest) {
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  // Skip CSRF validation for idempotent methods
  if (isIdempotentMethod(method)) {
    return { valid: true, response: null };
  }

  // Skip CSRF validation for auth endpoints
  if (isAuthEndpoint(pathname)) {
    return { valid: true, response: null };
  }

  // Get token from cookie and header
  const cookieToken = getCSRFTokenFromCookie(request);
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);

  // Check for token presence
  if (!cookieToken || !headerToken) {
    return {
      valid: false,
      response: NextResponse.json(
        { 
          error: 'CSRF token missing',
          message: 'XSRF-TOKEN cookie and x-csrf-token header are required for state-mutating requests'
        },
        { status: 403 }
      ),
    };
  }

  // Validate token using timing-safe comparison
  if (!timingSafeCompare(cookieToken, headerToken)) {
    return {
      valid: false,
      response: NextResponse.json(
        { 
          error: 'Invalid CSRF token',
          message: 'The provided CSRF token is invalid or has been tampered with'
        },
        { status: 403 }
      ),
    };
  }

  // Token is valid
  return { valid: true, response: null };
}

// Set CSRF token cookie for new sessions
export function setCSRFTokenCookie(response: NextResponse): void {
  const token = generateCSRFToken();
  response.cookies.set(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);
}

// Generate token for client-side usage
export function getCSRFToken(): string {
  return generateCSRFToken();
}