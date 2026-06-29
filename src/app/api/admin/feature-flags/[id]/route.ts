import { NextRequest, NextResponse } from 'next/server';
import { flagStore, createAuditEntry } from '@/lib/feature-flags/store';
import type { FeatureFlag, TargetingRule } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { edgeLog } from '@/../infra/edge-config';
import { requireAuth, hasRoleOrForbidden, getUserFromRequest } from '@/lib/authMiddleware';

export const runtime = 'edge';

// ─── GET /api/admin/feature-flags/[id] ───────────────────────────────────────
// Fetch a single feature flag by ID.
// Requires ADMIN role.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'GET request received');
  
  // Authentication check
  const authError = requireAuth(req);
  if (authError) return authError;

  // Authorization check: ADMIN only
  const authzError = hasRoleOrForbidden(req, 'ADMIN');
  if (authzError) return authzError;

  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const flag = flagStore.get(id);
  if (!flag) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  return addHeaders(NextResponse.json({ flag }));
}

// ─── PUT /api/admin/feature-flags/[id] ───────────────────────────────────────
// Full or partial update. Also handles toggle via { enabled: boolean }.
// Requires ADMIN role.

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'PUT request received');
  
  // Authentication check
  const authError = requireAuth(req);
  if (authError) return authError;

  // Authorization check: ADMIN only
  const authzError = hasRoleOrForbidden(req, 'ADMIN');
  if (authzError) return authzError;

  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const existing = flagStore.get(id);
  if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  const body = await req.json().catch(() => null);
  if (!body) return addHeaders(NextResponse.json({ message: 'Invalid JSON' }, { status: 400 }));

  const user = getUserFromRequest(req);
  const actor = user?.id ?? user?.email ?? 'anonymous';

  const updated: FeatureFlag = {
    ...existing,
    ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
    ...(typeof body.description === 'string' ? { description: body.description.trim() } : {}),
    ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
    ...(['all', 'percentage', 'targeting'].includes(body.strategy)
      ? { strategy: body.strategy }
      : {}),
    ...(typeof body.percentage === 'number'
      ? { percentage: Math.max(0, Math.min(100, body.percentage)) }
      : {}),
    ...(Array.isArray(body.rules) ? { rules: body.rules as TargetingRule[] } : {}),
    ...(Array.isArray(body.tags) ? { tags: body.tags.map(String) } : {}),
    updatedAt: new Date().toISOString(),
  };

  flagStore.set(id, updated);

  const action =
    typeof body.enabled === 'boolean' && body.enabled !== existing.enabled ? 'toggled' : 'updated';
  createAuditEntry(action, actor, existing, updated);

  const response = addHeaders(NextResponse.json({ flag: updated }));
  logAuditMutation(req, {
    action: 'update',
    targetType: 'feature-flag',
    targetId: updated.id,
    statusCode: response.status,
    metadata: { action, actor },
  });

  return response;
}

// ─── DELETE /api/admin/feature-flags/[id] ────────────────────────────────────
// Delete a feature flag by ID.
// Requires ADMIN role.

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'DELETE request received');
  
  // Authentication check
  const authError = requireAuth(req);
  if (authError) return authError;

  // Authorization check: ADMIN only
  const authzError = hasRoleOrForbidden(req, 'ADMIN');
  if (authzError) return authzError;

  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const existing = flagStore.get(id);
  if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  const user = getUserFromRequest(req);
  const actor = user?.id ?? user?.email ?? 'anonymous';
  
  flagStore.delete(id);
  createAuditEntry('deleted', actor, existing, null);

  const response = addHeaders(NextResponse.json({ message: 'Deleted' }));
  logAuditMutation(req, {
    action: 'delete',
    targetType: 'feature-flag',
    targetId: id,
    statusCode: response.status,
    metadata: { name: existing.name, actor },
  });

  return response;
}
