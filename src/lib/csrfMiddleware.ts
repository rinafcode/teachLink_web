import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection using Double-Submit Cookie pattern
 * 
 * How it works:
 * 1. Server generates a CSRF token and sets it as a cookie (httpOnly: false)
 * 2. Client reads the token from the cookie and sends it in the x-csrf-token header
 * 3. Server validates the header matches the cookie value
 * 4. If mismatch, returns 403 Forbidden
 * 
 * Why this approach:
 * - SameSite=Strict cookies alone are not sufficient for all cross-origin scenarios
 * - Double-submit cookie pattern is stateless and works well with Next.js
 * - No server-side storage required (tokens are validated against the cookie)
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get the CSRF token from the request cookies
 */
export function getCsrfTokenFromCookies(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Get the CSRF token from the request headers
 */
export function getCsrfTokenFromHeaders(request: NextRequest): string | undefined {
  return request.headers.get(CSRF_HEADER_NAME) || undefined;
}

/**
 * Validate that the CSRF token in the header matches the token in the cookie
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookies(request);
  const headerToken = getCsrfTokenFromHeaders(request);

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Compare tokens using timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'hex'),
    Buffer.from(headerToken, 'hex')
  );
}

/**
 * Set the CSRF token cookie on the response
 * 
 * @param response - The NextResponse to set the cookie on
 * @param token - The CSRF token to set (optional, generates one if not provided)
 * @param secure - Whether to set the cookie as secure (defaults to true in production)
 * @returns The response with the CSRF cookie set
 */
export function setCsrfCookie(
  response: NextResponse,
  token?: string,
  secure: boolean = process.env.NODE_ENV === 'production'
): NextResponse {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    httpOnly: false, // Must be false so JavaScript can read it
    secure: secure,
    sameSite: 'lax', // LAX provides a good balance of security and usability
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * Middleware to validate CSRF token for state-mutating requests
 * 
 * @param request - The NextRequest to validate
 * @param options - Configuration options
 * @param options.skipMethods - HTTP methods to skip validation for (default: GET, HEAD, OPTIONS)
 * @param options.exemptPaths - Paths to exempt from CSRF validation
 * @returns A NextResponse if validation fails, or null if validation passes
 */
export function validateCsrfRequest(
  request: NextRequest,
  options: {
    skipMethods?: string[];
    exemptPaths?: string[];
  } = {}
): NextResponse | null {
  const {
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    exemptPaths = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/discord',
      '/api/auth/email-verification',
    ],
  } = options;

  const method = request.method;
  const path = request.nextUrl.pathname;

  // Skip validation for safe methods
  if (skipMethods.includes(method)) {
    return null;
  }

  // Skip validation for exempt paths (e.g., auth endpoints)
  if (exemptPaths.some((exemptPath) => path.startsWith(exemptPath))) {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { 
        success: false,
        message: 'CSRF token validation failed. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Create a new CSRF token and set it as a cookie
 * Used for initial token generation on page load
 */
export function createCsrfTokenResponse(
  request: NextRequest,
  options: { secure?: boolean } = {}
): NextResponse {
  const token = generateCsrfToken();
  const response = NextResponse.json({ 
    csrfToken: token,
    message: 'CSRF token generated successfully'
  });
  return setCsrfCookie(response, token, options.secure);
}