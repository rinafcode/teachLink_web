import { NextRequest, NextResponse } from 'next/server';
import {
  flagStore,
  auditLog,
  createAuditEntry,
  generateId,
  evaluateFlag,
} from '@/lib/feature-flags/store';
import type { FeatureFlag, TargetingRule } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

// ─── GET /api/admin/feature-flags ─────────────────────────────────────────────
// Returns the full flag list sorted by updatedAt desc.

export async function GET(req: NextRequest) {
  edgeLog('info', '/api/admin/feature-flags', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const flags = Array.from(flagStore.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return addHeaders(NextResponse.json({ flags }));
}

// ─── POST /api/admin/feature-flags ───────────────────────────────────────────
// Creates a new flag.

export async function POST(req: NextRequest) {
  edgeLog('info', '/api/admin/feature-flags', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return addHeaders(NextResponse.json({ message: 'name is required' }, { status: 400 }));
  }

  const actor = req.headers.get('x-admin-user') ?? 'anonymous';
  const now = new Date().toISOString();

  const flag: FeatureFlag = {
    id: generateId('flag'),
    name: body.name.trim(),
    description: typeof body.description === 'string' ? body.description.trim() : '',
    enabled: false,
    strategy: ['all', 'percentage', 'targeting'].includes(body.strategy) ? body.strategy : 'all',
    percentage:
      typeof body.percentage === 'number' ? Math.max(0, Math.min(100, body.percentage)) : 0,
    rules: Array.isArray(body.rules) ? (body.rules as TargetingRule[]) : [],
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
  };

  flagStore.set(flag.id, flag);
  createAuditEntry('created', actor, null, flag);

  const response = addHeaders(NextResponse.json({ flag }, { status: 201 }));
  logAuditMutation(req, {
    action: 'create',
    targetType: 'feature-flag',
    targetId: flag.id,
    statusCode: response.status,
    metadata: { name: flag.name },
  });

  return response;
}
