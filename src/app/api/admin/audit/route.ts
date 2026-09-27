import { NextRequest, NextResponse } from 'next/server';
import { queryAuditLog, type AuditAction } from '@/lib/audit';
import { withRateLimit } from '@/lib/ratelimit';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api-admin-audit');

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

  try {
    const result = await queryAuditLog({
      search,
      action,
      actorId,
      targetType,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return addHeaders(NextResponse.json(result));
  } catch (error) {
    logger.error('[Admin Audit] Failed to query audit log', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return addHeaders(
      NextResponse.json({ entries: [], total: 0, error: 'Internal server error' }, { status: 500 })
    );
  }
}
