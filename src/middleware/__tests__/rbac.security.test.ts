import { NextRequest } from 'next/server';
import { checkRoutePermission } from '../rbac';
import { UserRole } from '@/types/api';

function makeRequest(pathname: string) {
  return new NextRequest(new URL(`http://localhost${pathname}`));
}

describe('RBAC middleware — role elevation prevention', () => {
  it('redirects to /login when no role is provided', () => {
    const res = checkRoutePermission(makeRequest('/admin'), null);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/login');
  });

  it('redirects to /unauthorized when STUDENT tries to access /admin', () => {
    const res = checkRoutePermission(makeRequest('/admin'), UserRole.STUDENT);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/unauthorized');
  });

  it('redirects to /unauthorized when INSTRUCTOR tries to access /admin', () => {
    const res = checkRoutePermission(makeRequest('/admin'), UserRole.INSTRUCTOR);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/unauthorized');
  });

  it('allows ADMIN to access /admin', () => {
    const res = checkRoutePermission(makeRequest('/admin'), UserRole.ADMIN);
    expect(res).toBeNull();
  });

  it('allows INSTRUCTOR to access /instructor', () => {
    const res = checkRoutePermission(makeRequest('/instructor'), UserRole.INSTRUCTOR);
    expect(res).toBeNull();
  });

  it('allows STUDENT to access /dashboard', () => {
    const res = checkRoutePermission(makeRequest('/dashboard'), UserRole.STUDENT);
    expect(res).toBeNull();
  });
});
