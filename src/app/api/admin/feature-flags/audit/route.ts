import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/admin/feature-flags/audit?flagId=<id>&limit=50&offset=0
 */
export async function GET(req: NextRequest) {
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'API');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const flagId  = searchParams.get('flagId');
  const limit   = Math.min(200, Math.max(1, parseInt(searchParams.get('limit')  ?? '50', 10)));
  const offset  = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));

  const filtered = flagId ? auditLog.filter((e) => e.flagId === flagId) : auditLog;
  const page = filtered.slice(offset, offset + limit);

  return addHeaders(NextResponse.json({ entries: page, total: filtered.length }));
}
