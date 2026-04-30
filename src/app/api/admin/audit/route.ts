import { NextRequest, NextResponse } from 'next/server';
import { queryAuditLogs, type AuditAction } from '@/lib/audit';
import { withRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);

  const actionParam = searchParams.get('action');
  const action =
    actionParam === 'create' || actionParam === 'update' || actionParam === 'delete'
      ? (actionParam as AuditAction)
      : undefined;

  const search = searchParams.get('search') ?? undefined;
  const actorId = searchParams.get('actorId') ?? undefined;
  const targetType = searchParams.get('targetType') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '50');
  const offset = Number(searchParams.get('offset') ?? '0');

  const result = queryAuditLogs({
    search,
    action,
    actorId,
    targetType,
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return addHeaders(NextResponse.json(result));
}
