import { NextRequest, NextResponse } from 'next/server';
import {
  getFlagById,
  updateFlag,
  deleteFlag,
  createAuditEntry,
} from '@/lib/feature-flags/store';
import type { TargetingRule } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

// ─── GET /api/admin/feature-flags/[id] ───────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  
  try {
    const flag = await getFlagById(id);
    if (!flag) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

    return addHeaders(NextResponse.json({ flag }));
  } catch (error) {
    edgeLog('error', '/api/admin/feature-flags/[id]', 'Failed to fetch flag', { error });
    return addHeaders(
      NextResponse.json({ message: 'Failed to fetch feature flag' }, { status: 500 }),
    );
  }
}

// ─── PUT /api/admin/feature-flags/[id] ───────────────────────────────────────
// Full or partial update. Also handles toggle via { enabled: boolean }.

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'PUT request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  
  try {
    const existing = await getFlagById(id);
    if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

    const body = await req.json().catch(() => null);
    if (!body) return addHeaders(NextResponse.json({ message: 'Invalid JSON' }, { status: 400 }));

    const actor = req.headers.get('x-admin-user') ?? 'anonymous';

    // Build the updates object
    const updates: any = {};
    
    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim();
    }
    if (typeof body.enabled === 'boolean') {
      updates.enabled = body.enabled;
    }
    if (['all', 'percentage', 'targeting'].includes(body.strategy)) {
      updates.strategy = body.strategy;
    }
    if (typeof body.percentage === 'number') {
      updates.percentage = Math.max(0, Math.min(100, body.percentage));
    }
    if (Array.isArray(body.rules)) {
      updates.rules = body.rules as TargetingRule[];
    }
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.map(String);
    }

    const updated = await updateFlag(id, updates);
    if (!updated) {
      return addHeaders(NextResponse.json({ message: 'Failed to update flag' }, { status: 500 }));
    }

    const action =
      typeof body.enabled === 'boolean' && body.enabled !== existing.enabled ? 'toggled' : 'updated';
    await createAuditEntry(action, actor, existing, updated);

    const response = addHeaders(NextResponse.json({ flag: updated }));
    logAuditMutation(req, {
      action: 'update',
      targetType: 'feature-flag',
      targetId: updated.id,
      statusCode: response.status,
      metadata: { action },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/admin/feature-flags/[id]', 'Failed to update flag', { error });
    return addHeaders(
      NextResponse.json({ message: 'Failed to update feature flag' }, { status: 500 }),
    );
  }
}

// ─── DELETE /api/admin/feature-flags/[id] ────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/admin/feature-flags/[id]', 'DELETE request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  
  try {
    const existing = await getFlagById(id);
    if (!existing) return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));

    const actor = req.headers.get('x-admin-user') ?? 'anonymous';
    const deleted = await deleteFlag(id);
    
    if (!deleted) {
      return addHeaders(NextResponse.json({ message: 'Failed to delete flag' }, { status: 500 }));
    }

    await createAuditEntry('deleted', actor, existing, null);

    const response = addHeaders(NextResponse.json({ message: 'Deleted' }));
    logAuditMutation(req, {
      action: 'delete',
      targetType: 'feature-flag',
      targetId: id,
      statusCode: response.status,
      metadata: { name: existing.name },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/admin/feature-flags/[id]', 'Failed to delete flag', { error });
    return addHeaders(
      NextResponse.json({ message: 'Failed to delete feature flag' }, { status: 500 }),
    );
  }
}
