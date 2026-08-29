// Imports directly from ./store (not the @/lib/audit barrel) to stay
// Edge-Runtime-safe: this middleware is reachable from Edge routes (e.g.
// src/app/api/admin/feature-flags/route.ts), and the barrel re-exports a
// database-backed appendAuditLog (via ./persist.ts) that pulls in `pg`,
// which needs Node.js core modules the Edge Runtime doesn't provide.
// Audit entries logged from here only reach the in-memory recent-entries
// buffer, not the durable database table — an accepted limitation of
// Edge routes, not a bug.
import { appendAuditLog } from '@/lib/audit/store';
import type { AuditAction } from '@/lib/audit/types';

export interface AuditMutationInput {
  action: AuditAction;
  targetType: string;
  targetId: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

function getRequestHeader(request: Request, name: string): string {
  return request.headers.get(name)?.trim() ?? '';
}

function getClientIp(request: Request): string {
  const forwardedFor = getRequestHeader(request, 'x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = getRequestHeader(request, 'x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
}

function getActorId(request: Request): string {
  return (
    getRequestHeader(request, 'x-admin-user') ||
    getRequestHeader(request, 'x-user-id') ||
    'anonymous'
  );
}

export function logAuditMutation(request: Request, input: AuditMutationInput): void {
  if (input.statusCode >= 400) {
    return;
  }

  const url = new URL(request.url);

  appendAuditLog({
    actorId: getActorId(request),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    path: url.pathname,
    method: request.method,
    ip: getClientIp(request),
    userAgent: getRequestHeader(request, 'user-agent') || 'unknown',
    statusCode: input.statusCode,
    metadata: input.metadata,
  });
}
