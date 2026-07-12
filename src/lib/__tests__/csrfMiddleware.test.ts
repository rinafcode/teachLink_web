import { NextRequest, NextResponse } from 'next/server';
import {
  generateCsrfToken,
  getCsrfTokenFromCookies,
  getCsrfTokenFromHeaders,
  validateCsrfToken,
  validateCsrfRequest,
  setCsrfCookie,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../csrfMiddleware';

describe('CSRF Middleware', () => {
  describe('generateCsrfToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates different tokens each time', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateCsrfToken', () => {
    it('returns true when tokens match', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          [CSRF_HEADER_NAME]: token,
        },
      });
      // Set cookie manually
      request.cookies.set(CSRF_COOKIE_NAME, token);
      
      expect(validateCsrfToken(request)).toBe(true);
    });

    it('returns false when tokens do not match', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          [CSRF_HEADER_NAME]: token1,
        },
      });
      request.cookies.set(CSRF_COOKIE_NAME, token2);
      
      expect(validateCsrfToken(request)).toBe(false);
    });

    it('returns false when cookie token is missing', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          [CSRF_HEADER_NAME]: token,
        },
      });
      
      expect(validateCsrfToken(request)).toBe(false);
    });

    it('returns false when header token is missing', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test');
      request.cookies.set(CSRF_COOKIE_NAME, token);
      
      expect(validateCsrfToken(request)).toBe(false);
    });
  });

  describe('validateCsrfRequest', () => {
    it('returns null for GET requests (skipped)', () => {
      const request = new NextRequest('http://localhost/api/notes', {
        method: 'GET',
      });
      expect(validateCsrfRequest(request)).toBeNull();
    });

    it('returns null for HEAD requests (skipped)', () => {
      const request = new NextRequest('http://localhost/api/notes', {
        method: 'HEAD',
      });
      expect(validateCsrfRequest(request)).toBeNull();
    });

    it('returns null for OPTIONS requests (skipped)', () => {
      const request = new NextRequest('http://localhost/api/notes', {
        method: 'OPTIONS',
      });
      expect(validateCsrfRequest(request)).toBeNull();
    });

    it('returns null for auth endpoints (exempt)', () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
      });
      expect(validateCsrfRequest(request)).toBeNull();
    });

    it('returns 403 response when CSRF validation fails for POST', () => {
      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: 'invalid-token',
        },
      });
      request.cookies.set(CSRF_COOKIE_NAME, 'different-token');
      
      const result = validateCsrfRequest(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('returns null when CSRF validation passes for POST', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: token,
        },
      });
      request.cookies.set(CSRF_COOKIE_NAME, token);
      
      expect(validateCsrfRequest(request)).toBeNull();
    });
  });

  describe('setCsrfCookie', () => {
    it('sets the CSRF cookie with the correct name', () => {
      const token = generateCsrfToken();
      const response = new NextResponse();
      const result = setCsrfCookie(response, token);
      
      const cookieHeader = result.cookies.toString();
      expect(cookieHeader).toContain(CSRF_COOKIE_NAME);
      expect(cookieHeader).toContain(token);
    });

    it('sets httpOnly to false', () => {
      const token = generateCsrfToken();
      const response = new NextResponse();
      const result = setCsrfCookie(response, token);
      
      const cookieHeader = result.cookies.toString();
      expect(cookieHeader).toContain('HttpOnly=false');
    });
  });
});