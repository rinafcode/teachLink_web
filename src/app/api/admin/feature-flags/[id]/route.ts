import { NextRequest, NextResponse } from 'next/server';
import { flagStore, createAuditEntry } from '@/lib/feature-flags/store';
import type { FeatureFlag, TargetingRule } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';

// ─── GET /api/admin/feature-flags/[id] ───────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const flag = flagStore.get(id);
  if (!flag) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  return addHeaders(NextResponse.json({ flag }));
}

// ─── PUT /api/admin/feature-flags/[id] ───────────────────────────────────────
// Full or partial update. Also handles toggle via { enabled: boolean }.

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const existing = flagStore.get(id);
  if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  const body = await req.json().catch(() => null);
  if (!body) return addHeaders(NextResponse.json({ message: 'Invalid JSON' }, { status: 400 }));

  const actor = req.headers.get('x-admin-user') ?? 'anonymous';

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

  return addHeaders(NextResponse.json({ flag: updated }));
}

// ─── DELETE /api/admin/feature-flags/[id] ────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const existing = flagStore.get(id);
  if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

  const actor = req.headers.get('x-admin-user') ?? 'anonymous';
  flagStore.delete(id);
  createAuditEntry('deleted', actor, existing, null);

  return addHeaders(NextResponse.json({ message: 'Deleted' }));
}
