import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

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

function createMockRequest(pathname: string): NextRequest {
  const nextUrl = new MockNextUrl(pathname);

  return {
    nextUrl,
    url: `http://localhost${pathname}`,
    headers: new Map() as any,
    cookies: { get: () => undefined },
  } as unknown as NextRequest;
}

describe('API version string validation in middleware', () => {
  describe('valid version strings — should route correctly', () => {
    it('accepts v1 and sets X-Api-Version header', () => {
      const req = createMockRequest('/api/v1/posts');
      const res = middleware(req);
      expect(res.status).not.toBe(400);
      expect(res.headers.get('X-Api-Version')).toBe('v1');
    });

    it('accepts v2 and sets X-Api-Version header', () => {
      const req = createMockRequest('/api/v2/posts');
      const res = middleware(req);
      expect(res.status).not.toBe(400);
      expect(res.headers.get('X-Api-Version')).toBe('v2');
    });

    it('accepts large version numbers like v10', () => {
      const req = createMockRequest('/api/v10/posts');
      const res = middleware(req);
      expect(res.status).not.toBe(400);
      expect(res.headers.get('X-Api-Version')).toBe('v10');
    });
  });

  describe('malformed version strings — should return 400', () => {
    it('rejects alphabetic version string (vABC)', () => {
      const req = createMockRequest('/api/vABC/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });

    it('rejects path-traversal characters (/../)', () => {
      const req = createMockRequest('/api/../v1/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });

    it('rejects empty version segment (/api/v/)', () => {
      const req = createMockRequest('/api/v/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });

    it('rejects version with special characters (v1.2)', () => {
      const req = createMockRequest('/api/v1.2/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });

    it('rejects version with injection attempt (v1;drop)', () => {
      const req = createMockRequest('/api/v1;drop/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });

    it('rejects purely numeric version without v prefix (123)', () => {
      const req = createMockRequest('/api/123/posts');
      const res = middleware(req);
      expect(res.status).toBe(400);
    });
  });
});
