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
});
