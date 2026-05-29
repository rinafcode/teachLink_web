import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { consentPreferencesSchema, type ConsentPreferences } from '@/lib/consent/types';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * Ephemeral in-memory store for consent records.
 * Replace with a persistent KV / DB in production.
 */
const consentDb = new Map<
  string,
  { preferences: ConsentPreferences; decidedAt: number }
>();

const putBodySchema = z.object({
  userId: z.string().min(1).max(256),
  preferences: consentPreferencesSchema,
  decidedAt: z.number().int(),
});

/** GET /api/v1/consent?userId=<id> — retrieve stored consent for a user */
export async function GET(request: Request) {
  edgeLog('info', '/api/v1/consent', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId?.trim()) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 }),
    );
  }

  const row = consentDb.get(userId);
  if (!row) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'No consent record found', data: null }, { status: 404 }),
    );
  }

  return addHeaders(
    NextResponse.json({ success: true, data: { userId, ...row } }),
  );
}

/** PUT /api/v1/consent — store or update consent preferences for a user */
export async function PUT(request: Request) {
  edgeLog('info', '/api/v1/consent', 'PUT request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 }),
    );
  }

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  const { userId, preferences, decidedAt } = parsed.data;
  consentDb.set(userId, { preferences, decidedAt });

  return addHeaders(
    NextResponse.json({ success: true, message: 'Consent preferences saved' }),
  );
}

/** DELETE /api/v1/consent?userId=<id> — withdraw consent and remove record */
export async function DELETE(request: Request) {
  edgeLog('info', '/api/v1/consent', 'DELETE request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId?.trim()) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 }),
    );
  }

  consentDb.delete(userId);

  return addHeaders(
    NextResponse.json({ success: true, message: 'Consent record removed' }),
  );
}
