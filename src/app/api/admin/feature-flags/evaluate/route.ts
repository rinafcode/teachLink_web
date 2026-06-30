import { NextRequest, NextResponse } from 'next/server';
import { flagStore, evaluateFlag } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { requireAuth, hasRoleOrForbidden } from '@/lib/authMiddleware';

export const runtime = 'edge';

/**
 * GET /api/admin/feature-flags/evaluate?id=<flagId>&userId=<uid>&plan=<plan>…
 *
 * All query params beyond `id` are passed as the evaluation context.
 * Requires ADMIN role.
 */
export async function GET(req: NextRequest) {
  edgeLog('info', '/api/admin/feature-flags/evaluate', 'GET request received');
  
  // Authentication check
  const authError = requireAuth(req);
  if (authError) return authError;

  // Authorization check: ADMIN only
  const authzError = hasRoleOrForbidden(req, 'ADMIN');
  if (authzError) return authzError;

  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return addHeaders(NextResponse.json({ message: 'id param required' }, { status: 400 }));
  }

  const flag = flagStore.get(id);
  if (!flag) {
    return addHeaders(NextResponse.json({ message: 'Not found' }, { status: 404 }));
  }

  // Build context from remaining search params
  const context: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'id') context[key] = value;
  });

  const isEnabled = evaluateFlag(flag, context);
  return addHeaders(NextResponse.json({ flag, isEnabled, context }));
}
