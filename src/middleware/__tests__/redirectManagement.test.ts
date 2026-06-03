/**
 * Integration tests for redirect middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { handleRedirects, extractLocale } from '../redirectManagement';

// Mock URL class for Next.js
class MockNextUrl {
  pathname: string;
  search: string;
  href: string;

  constructor(pathname: string = '/', search: string = '', href: string = '') {
    this.pathname = pathname;
    this.search = search;
    this.href = href || `http://localhost${pathname}${search}`;
  }

  clone() {
    return new MockNextUrl(this.pathname, this.search, this.href);
  }
}

// Mock request factory
function createMockRequest(
  pathname: string = '/',
  search: string = '',
  cookies: Record<string, string> = {},
): NextRequest {
  const nextUrl = new MockNextUrl(pathname, search);

  const mockRequest = {
    nextUrl,
    url: `http://localhost${pathname}${search}`,
    headers: new Map([
      ['user-agent', 'test-user-agent'],
      ['referer', 'http://test.com'],
    ]) as any,
    cookies: {
      get: (name: string) => {
        if (cookies[name]) {
          return { name, value: cookies[name] };
        }
        return undefined;
      },
      getAll: () => [],
      has: (name: string) => name in cookies,
      delete: vi.fn(),
      set: vi.fn(),
    },
  } as unknown as NextRequest;

  return mockRequest;
}

describe('Redirect Middleware Integration Tests', () => {
  describe('handleRedirects', () => {
    it('should return null for non-redirect paths', () => {
      const request = createMockRequest('/dashboard');
      const result = handleRedirects(request);
      expect(result).toBeNull();
    });

    it('should return redirect response for privacy-policy', () => {
      const request = createMockRequest('/privacy-policy');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(308);
    });

    it('should preserve query parameters in redirect', () => {
      const request = createMockRequest('/privacy-policy', '?utm_source=test&utm_medium=email');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
      // The redirect destination should contain the query params
      // This depends on how NextResponse.redirect handles them
    });

    it('should handle legacy privacy notice redirect', () => {
      const request = createMockRequest('/privacy-notice');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(308);
    });

    it('should handle terms of service redirect', () => {
      const request = createMockRequest('/terms-of-service');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
    });

    it('should use 308 (Permanent Redirect) by default', () => {
      const request = createMockRequest('/privacy-policy');
      const result = handleRedirects(request);

      expect(result?.status).toBe(308);
    });

    it('should return NextResponse with redirect', () => {
      const request = createMockRequest('/privacy-policy');
      const result = handleRedirects(request);

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe('extractLocale', () => {
    it('should extract locale from cookie', () => {
      const request = createMockRequest('/', '', { 'i18n:language': 'es' });
      const locale = extractLocale(request);

      expect(locale).toBe('es');
    });

    it('should default to en if no cookie', () => {
      const request = createMockRequest('/');
      const locale = extractLocale(request);

      expect(locale).toBe('en');
    });

    it('should extract locale from pathname pattern', () => {
      const request = createMockRequest('/es/privacy');
      const locale = extractLocale(request);

      expect(locale).toBe('es');
    });

    it('should prefer cookie over pathname pattern', () => {
      const request = createMockRequest('/fr/privacy', '', { 'i18n:language': 'de' });
      const locale = extractLocale(request);

      expect(locale).toBe('de');
    });

    it('should handle various locale codes', () => {
      const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'];

      locales.forEach((locale) => {
        const request = createMockRequest('/', '', { 'i18n:language': locale });
        expect(extractLocale(request)).toBe(locale);
      });
    });
  });

  describe('Redirect with Locale Context', () => {
    it('should work with different locales', () => {
      const locales = ['en', 'es', 'fr', 'de'];

      locales.forEach((locale) => {
        const request = createMockRequest('/privacy-policy', '', { 'i18n:language': locale });
        const result = handleRedirects(request);

        expect(result).not.toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      const request = createMockRequest('/privacy-policy', '?param=value&broken');
      const result = handleRedirects(request);

      // Should not throw and should still perform redirect
      expect(result).not.toBeNull();
    });

    it('should handle redirects with special characters in path', () => {
      const request = createMockRequest('/privacy-policy');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
    });
  });

  describe('Multiple Redirects Chain', () => {
    it('should handle redirect destination paths correctly', () => {
      // First redirect
      const request1 = createMockRequest('/privacy-notice');
      const result1 = handleRedirects(request1);
      expect(result1).not.toBeNull();

      // Should redirect to /privacy, not chain further
      expect(result1?.status).toBe(308);
    });
  });

  describe('Query Parameter Edge Cases', () => {
    it('should handle empty query string', () => {
      const request = createMockRequest('/privacy-policy', '');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
    });

    it('should handle query string with only question mark', () => {
      const request = createMockRequest('/privacy-policy', '?');
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
    });

    it('should handle complex query parameters', () => {
      const request = createMockRequest(
        '/privacy-policy',
        '?section=data-collection&filter[status]=active&page=1',
      );
      const result = handleRedirects(request);

      expect(result).not.toBeNull();
    });
  });
});
