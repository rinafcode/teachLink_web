import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF protection for state-mutating API routes (double-submit cookie
 * pattern).
 *
 * How it works:
 *  1. On any request that doesn't already carry a CSRF cookie, the server
 *     issues one: a random, unguessable token stored in a cookie that is
 *     readable by client-side JS (not `httpOnly`) so the frontend can copy
 *     its value into a request header.
 *  2. On every state-mutating request (anything but GET/HEAD/OPTIONS), the
 *     caller must echo that same value back in the `x-csrf-token` header.
 *  3. The request is rejected with 403 unless the cookie value and the
 *     header value are both present and equal.
 *
 * Why this stops CSRF: a cross-origin page can make the victim's browser
 * *send* the cookie automatically (that's what cookies do), but the
 * same-origin policy prevents it from *reading* the cookie's value, so it
 * cannot construct a matching `x-csrf-token` header. Only same-origin
 * JavaScript — which can read `document.cookie` for a non-httpOnly cookie
 * served from that origin — can produce a request where both values match.
 */

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Route path prefixes exempt from CSRF validation: endpoints a caller must
 * be able to reach *before* they have an authenticated session (there is no
 * pre-existing session for an attacker to ride on, and often no CSRF cookie
 * yet either). This matches the acceptance criteria's explicit carve-out for
 * login/signup.
 */
const EXEMPT_PATH_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/github',
  '/api/auth/google',
  '/api/auth/discord',
  '/api/auth/email-verification',
];

export function isCsrfExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function generateCsrfToken(): string {
  // 32 random bytes, hex-encoded — collision-resistant and easy to compare
  // as a plain string.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CsrfCheckResult {
  /** Set when validation failed; callers should return this response as-is (after applying shared headers/cookie). */
  errorResponse?: NextResponse;
  /** A freshly generated token that must be persisted on the eventual response's cookie, when the caller had none yet. */
  tokenToIssue?: string;
}

/**
 * Validates the double-submit CSRF token for a request, and/or decides
 * whether a fresh token needs to be issued (when the caller has none yet).
 * Does not itself write any response — callers apply `tokenToIssue` via
 * {@link applyCsrfCookie} on whatever response they end up returning, so a
 * single check works across every exit path of a caller like
 * `src/middleware.ts`.
 */
export function checkCsrf(request: NextRequest): CsrfCheckResult {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const tokenToIssue = existingToken ? undefined : generateCsrfToken();

  if (SAFE_METHODS.has(method) || isCsrfExemptPath(pathname)) {
    return { tokenToIssue };
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!existingToken || !headerToken || existingToken !== headerToken) {
    return {
      tokenToIssue,
      errorResponse: NextResponse.json(
        { success: false, message: 'Invalid or missing CSRF token' },
        { status: 403 },
      ),
    };
  }

  return { tokenToIssue };
}

/** Persists a (freshly issued) CSRF token on the response as a readable, `SameSite=Strict` cookie. */
export function applyCsrfCookie(
  response: NextResponse,
  token: string,
  isHttps: boolean,
): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // must be readable by client JS to echo back as a header
    sameSite: 'strict',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });
  return response;
}
