import { NextRequest, NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * GET /api/admin/feature-flags/audit?flagId=<id>&limit=50
 */
export async function GET(req: NextRequest) {
  edgeLog('info', '/api/admin/feature-flags/audit', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const flagId = searchParams.get('flagId') ?? undefined;
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

  try {
    const entries = await getAuditLog(flagId, limit);
    return addHeaders(NextResponse.json({ entries, total: entries.length }));
  } catch (error) {
    edgeLog('error', '/api/admin/feature-flags/audit', 'Failed to fetch audit log', { error });
    return addHeaders(
      NextResponse.json({ message: 'Failed to fetch audit log' }, { status: 500 }),
    );
  }
}
