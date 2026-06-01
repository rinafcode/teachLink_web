import { describe, expect, it, vi } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRoutePermission } from '../rbac';
import { UserRole } from '@/types/api';

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
  } as NextRequest;
}

describe('checkRoutePermission', () => {
  it('allows instructors and admins to access /editor', () => {
    const request = createMockRequest('/editor');

    expect(checkRoutePermission(request, UserRole.INSTRUCTOR)).toBeNull();
    expect(checkRoutePermission(request, UserRole.ADMIN)).toBeNull();
  });

  it('redirects students from /editor to unauthorized', () => {
    const request = createMockRequest('/editor');
    const response = checkRoutePermission(request, UserRole.STUDENT);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(307);
  });

  it('redirects anonymous visitors to login', () => {
    const request = createMockRequest('/editor');
    const response = checkRoutePermission(request, null);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(307);
  });

  it('does not interfere with public routes', () => {
    const request = createMockRequest('/editorial');
    expect(checkRoutePermission(request, UserRole.ADMIN)).toBeNull();
  });
});
