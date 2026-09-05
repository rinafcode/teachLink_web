import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import { UserRole } from '@/types/api';
import { isAtLeastRole } from '@/lib/auth/acl';

/**
 * Define which routes require which minimum roles.
 */
const ROUTE_PERMISSIONS: Record<string, UserRole> = {
  '/admin': UserRole.ADMIN,
  '/instructor': UserRole.INSTRUCTOR,
  '/editor': UserRole.INSTRUCTOR,
  '/dashboard': UserRole.STUDENT,
  '/profile': UserRole.STUDENT,
};

type RouteDecision = 'allow' | 'login' | 'unauthorized';

class RoutePermissionCache {
  private store = new Map<string, { decision: RouteDecision; expiry: number }>();
  private readonly TTL_MS = 60_000;
  private readonly MAX_SIZE = 1000;

  get(key: string): RouteDecision | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.decision;
  }

  set(key: string, decision: RouteDecision): void {
    if (this.store.size >= this.MAX_SIZE) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, { decision, expiry: Date.now() + this.TTL_MS });
  }

  clear(): void {
    this.store.clear();
  }
}

const routePermissionCache = new RoutePermissionCache();

function getSessionId(request: NextRequest): string {
  return request.cookies.get('session')?.value ?? 'anonymous';
}

function getCacheKey(
  pathname: string,
  userRole: UserRole | null,
  sessionId: string,
): string {
  return `${sessionId}:${pathname}:${userRole ?? 'none'}';
}

function decisionToResponse(
  decision: RouteDecision,
  request: NextRequest,
): NextResponse | null {
  if (decision === 'allow') return null;
  if (decision === 'login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.redirect(new URL('/unauthorized', request.url));
}

/**
 * RBAT Helper for Middleware
 */
export function checkRoutePermission(
  request: NextRequest,
  userRole: UserRole | null,
): NextResponse | null {
  const { pathname } = request.nextUrl;
  const sessionId = getSessionId(request);
  const cacheKey = getCacheKey(pathname, userRole, sessionId);

  const cachedDecision = routePermissionCache.get(cacheKey);
  if (cachedDecision) {
    return decisionToResponse(cachedDecision, request);
  }

  // Find the required role for the current path
  const requiredRole = Object.entries(ROUTE_PERMISSIONS).find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  )?[1];

  let decision: RouteDecision;
  if (!requiredRole) {
    decision = 'allow';
  } else if (!userRole) {
    decision = 'login';
  } else if (!isAtLeastRole(userRole, requiredRole)) {
    decision = 'unauthorized';
  } else {
    decision = 'allow';
  }

  routePermissionCache.set(cacheKey, decision);
  return decisionToResponse(decision, request);
}