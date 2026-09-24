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
    // A real Headers instance: the middleware attaches the trace id and the CSP
    // nonce to the request before forwarding it to the app.
    headers: new Headers(headers),
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
  it('rewrites legacy /api/* paths to /api/v1/* and includes deprecation headers', async () => {
    const request = createMockRequest('/api/help');
    const response = (await middleware(request)) as NextResponse;

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    expect(response.headers.get(API_DEPRECATION_HEADER)).toBe('true');
    expect(response.headers.get(API_DEPRECATION_INFO_HEADER)).toContain('/api/v1/help');
  });

  it('does not rewrite internal API requests and preserves the default API version header', async () => {
    const request = createMockRequest('/api/help', {
      [INTERNAL_API_REQUEST_HEADER.toLowerCase()]: 'true',
    });
    const response = (await middleware(request)) as NextResponse;

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    expect(response.headers.get(API_DEPRECATION_HEADER)).toBeNull();
  });

  describe('valid version strings — should route correctly', () => {
    it('accepts v1 and sets X-Api-Version header', async () => {
      const request = createMockRequest('/api/v1/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
    });

    it('accepts v2 and sets X-Api-Version header', async () => {
      const request = createMockRequest('/api/v2/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v2');
    });

    it('accepts large version numbers like v10', async () => {
      const request = createMockRequest('/api/v10/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v10');
    });
  });

  describe('malformed version strings — should return 400', () => {
    it('rejects alphabetic version string (vABC)', async () => {
      const request = createMockRequest('/api/vABC/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects empty version segment (/api/v/)', async () => {
      const request = createMockRequest('/api/v/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects version with special characters (v1.2)', async () => {
      const request = createMockRequest('/api/v1.2/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).toBe(400);
    });

    it('rejects version with injection attempt (v1;drop)', async () => {
      const request = createMockRequest('/api/v1;drop/posts');
      const response = (await middleware(request)) as NextResponse;
      expect(response.status).toBe(400);
    });
  });

  // Only `/api/v*` is parsed as a version. Anything else is a legacy unversioned
  // path and is rewritten onto the default version rather than rejected.
  describe('unversioned paths — rewritten to the default version', () => {
    it('treats a bare numeric segment as a legacy path, not a version', async () => {
      const request = createMockRequest('/api/123/posts');
      const response = (await middleware(request)) as NextResponse;

      expect(response.status).not.toBe(400);
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
      expect(response.headers.get(API_DEPRECATION_HEADER)).toBe('true');
      expect(response.headers.get(API_DEPRECATION_INFO_HEADER)).toContain('/api/v1/123/posts');
    });

    it('does not read a version out of a traversal segment', async () => {
      const request = createMockRequest('/api/../v1/posts');
      const response = (await middleware(request)) as NextResponse;

      // `..` is never accepted as the version; the path falls through to the
      // legacy rewrite, and the URL itself is normalised when it is resolved.
      expect(response.headers.get(API_VERSION_HEADER)).toBe('v1');
      expect(response.headers.get(API_DEPRECATION_HEADER)).toBe('true');
    });
  });
});
