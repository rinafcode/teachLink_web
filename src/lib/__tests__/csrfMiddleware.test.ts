import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  applyCsrfCookie,
  checkCsrf,
  isCsrfExemptPath,
} from '../csrfMiddleware';

function makeRequest(opts: {
  method: string;
  pathname: string;
  cookie?: string;
  csrfHeader?: string;
}): NextRequest {
  const headers = new Headers();
  if (opts.cookie) headers.set('cookie', opts.cookie);
  if (opts.csrfHeader) headers.set(CSRF_HEADER_NAME, opts.csrfHeader);

  return new NextRequest(new URL(`http://localhost${opts.pathname}`), {
    method: opts.method,
    headers,
  });
}

describe('checkCsrf', () => {
  it('allows safe methods (GET/HEAD/OPTIONS) without a token', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const request = makeRequest({ method, pathname: '/api/notes' });
      const result = checkCsrf(request);
      expect(result.errorResponse).toBeUndefined();
    }
  });

  it('issues a fresh token when the caller has no CSRF cookie yet', () => {
    const request = makeRequest({ method: 'GET', pathname: '/api/notes' });
    const result = checkCsrf(request);
    expect(result.tokenToIssue).toBeDefined();
    expect(result.tokenToIssue).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not re-issue a token when the caller already has one', () => {
    const request = makeRequest({
      method: 'GET',
      pathname: '/api/notes',
      cookie: `${CSRF_COOKIE_NAME}=existing-token-value`,
    });
    const result = checkCsrf(request);
    expect(result.tokenToIssue).toBeUndefined();
  });

  it('rejects a same-origin-looking mutating request with no CSRF cookie/header at all (cross-origin POST simulation) with 403', async () => {
    const request = makeRequest({ method: 'POST', pathname: '/api/notes' });
    const result = checkCsrf(request);

    expect(result.errorResponse).toBeInstanceOf(NextResponse);
    expect(result.errorResponse?.status).toBe(403);
    const body = await result.errorResponse?.json();
    expect(body.success).toBe(false);
  });

  it('rejects a mutating request that has the cookie but no matching header (attacker can trigger the cookie to be sent, but cannot read it to forge the header)', () => {
    const request = makeRequest({
      method: 'POST',
      pathname: '/api/bookmarks',
      cookie: `${CSRF_COOKIE_NAME}=real-token`,
      // no csrfHeader set — simulates a cross-origin form POST, which cannot set custom headers
    });
    const result = checkCsrf(request);
    expect(result.errorResponse?.status).toBe(403);
  });

  it('rejects a mutating request where the header does not match the cookie', () => {
    const request = makeRequest({
      method: 'PATCH',
      pathname: '/api/bookmarks',
      cookie: `${CSRF_COOKIE_NAME}=real-token`,
      csrfHeader: 'guessed-token',
    });
    const result = checkCsrf(request);
    expect(result.errorResponse?.status).toBe(403);
  });

  it('accepts a mutating request where the header matches the cookie (legitimate same-origin request)', () => {
    for (const method of ['POST', 'PATCH', 'DELETE']) {
      const request = makeRequest({
        method,
        pathname: '/api/notes',
        cookie: `${CSRF_COOKIE_NAME}=matching-token`,
        csrfHeader: 'matching-token',
      });
      const result = checkCsrf(request);
      expect(result.errorResponse).toBeUndefined();
    }
  });

  it('exempts login and signup from CSRF validation (no pre-existing session to forge)', () => {
    for (const pathname of ['/api/auth/login', '/api/auth/signup']) {
      const request = makeRequest({ method: 'POST', pathname });
      const result = checkCsrf(request);
      expect(result.errorResponse).toBeUndefined();
    }
  });

  it('does not exempt other mutating auth-adjacent routes by accident', () => {
    expect(isCsrfExemptPath('/api/notes')).toBe(false);
    expect(isCsrfExemptPath('/api/bookmarks')).toBe(false);
    expect(isCsrfExemptPath('/api/approvals')).toBe(false);
    expect(isCsrfExemptPath('/api/tips')).toBe(false);
  });
});

describe('applyCsrfCookie', () => {
  it('sets a non-httpOnly, SameSite=Strict cookie', () => {
    const response = NextResponse.json({ ok: true });
    applyCsrfCookie(response, 'abc123', true);

    const cookie = response.cookies.get(CSRF_COOKIE_NAME);
    expect(cookie?.value).toBe('abc123');
    expect(cookie?.sameSite).toBe('strict');
    expect(cookie?.httpOnly).toBeFalsy();
    expect(cookie?.secure).toBe(true);
  });

  it('does not mark the cookie secure over plain HTTP (local dev)', () => {
    const response = NextResponse.json({ ok: true });
    applyCsrfCookie(response, 'abc123', false);

    expect(response.cookies.get(CSRF_COOKIE_NAME)?.secure).toBeFalsy();
  });
});
