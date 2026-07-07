/**
 * Tests for API versioning middleware behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { middleware } from '../../middleware';
import {
  API_DEPRECATION_HEADER,
  API_DEPRECATION_INFO_HEADER,
  API_VERSION_HEADER,
  INTERNAL_API_REQUEST_HEADER,
} from '@/lib/apiVersioning';

class MockNextUrl {
  pathname: string;
  search: string;
  href: string;

  constructor(pathname = '/', search = '') {
    this.pathname = pathname;
    this.search = search;
    this.href = `http://localhost${pathname}${search}`;
  }

  clone() {
    return new MockNextUrl(this.pathname, this.search);
  }

  toString() {
    return this.href;
  }
}

function createMockRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: new MockNextUrl(pathname),
    url: `http://localhost${pathname}`,
    method: 'GET',
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
    cookies: {
      get: () => undefined,
      getAll: () => [],
      has: () => false,
      delete: vi.fn(),
      set: vi.fn(),
    },
  } as unknown as NextRequest;
}

describe('API versioning middleware', () => {
  it('rewrites legacy /api/* paths to /api/v1/* and includes deprecation headers', () => {
    const request = createMockRequest('/api/help');
    const response = middleware(request) as NextResponse;

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    expect(response.headers.get(API_DEPRECATION_HEADER)).toBe('true');
    expect(response.headers.get(API_DEPRECATION_INFO_HEADER)).toContain('/api/v1/help');
  });

  it('does not rewrite internal API requests and preserves the default API version header', () => {
    const request = createMockRequest('/api/help', {
      [INTERNAL_API_REQUEST_HEADER.toLowerCase()]: 'true',
    });
    const response = middleware(request) as NextResponse;

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    expect(response.headers.get(API_DEPRECATION_HEADER)).toBeNull();
  });

  describe('valid version strings — should route correctly', () => {
    it('accepts v1 and sets X-Api-Version header', () => {
      const request = createMockRequest('/api/v1/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    });

    it('accepts v2 and sets X-Api-Version header', () => {
      const request = createMockRequest('/api/v2/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v2');
    });

    it('accepts large version numbers like v10', () => {
      const request = createMockRequest('/api/v10/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v10');
    });
  });

  describe('malformed version strings — should return 400', () => {
    it('rejects alphabetic version string (vABC)', () => {
      const request = createMockRequest('/api/vABC/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects path-traversal characters (/../)', () => {
      const request = createMockRequest('/api/../v1/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects empty version segment (/api/v/)', () => {
      const request = createMockRequest('/api/v/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects version with special characters (v1.2)', () => {
      const request = createMockRequest('/api/v1.2/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects version with injection attempt (v1;drop)', () => {
      const request = createMockRequest('/api/v1;drop/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects purely numeric version without v prefix (123)', () => {
      const request = createMockRequest('/api/123/posts');
      const response = middleware(request) as NextResponse;
      expect(response.status).toBe(400);
    });
  });
});