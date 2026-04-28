import { NextRequest, NextResponse } from 'next/server';
import { flagStore, evaluateFlag } from '@/lib/feature-flags/store';
import { withRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/admin/feature-flags/evaluate?id=<flagId>&userId=<uid>&plan=<plan>…
 *
 * All query params beyond `id` are passed as the evaluation context.
 */
export async function GET(req: NextRequest) {
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
