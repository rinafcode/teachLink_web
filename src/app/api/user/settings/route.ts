import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { appSettingsSchema, createDefaultSettings, type AppSettings } from '@/lib/settings/types';

/**
 * Ephemeral server-side store for syncing settings across devices for a given sync key.
 * Replace with persistent DB (PostgreSQL, KV, etc.) in production deployments.
 */
const remoteSettingsDb = new Map<string, { settings: AppSettings; updatedAt: number }>();

const putBodySchema = z.object({
  userId: z.string().min(1).max(256),
  settings: appSettingsSchema,
  updatedAt: z.number().int(),
});

export async function GET(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId?.trim()) {
    return addHeaders(
      NextResponse.json(
        {
          success: false,
          message: 'userId query parameter is required',
          data: { settings: createDefaultSettings(), updatedAt: 0 },
        },
        { status: 400 },
      ),
    );
  }

  const row = remoteSettingsDb.get(userId);
  if (!row) {
    return addHeaders(
      NextResponse.json(
        {
          success: false,
          message: 'No remote settings saved yet',
          data: { settings: createDefaultSettings(), updatedAt: 0 },
        },
        { status: 404 },
      ),
    );
  }

  return addHeaders(
    NextResponse.json({
      success: true,
      data: { settings: row.settings, updatedAt: row.updatedAt },
    }),
  );
}

export async function PUT(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const json = await request.json();
    const parsed = putBodySchema.safeParse(json);

    if (!parsed.success) {
      return addHeaders(
        NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
      );
    }

    const { userId, settings, updatedAt } = parsed.data;
    remoteSettingsDb.set(userId, { settings, updatedAt });

    return addHeaders(
      NextResponse.json({
        success: true,
        message: 'Settings saved.',
        data: { settings, updatedAt },
      }),
    );
  } catch {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Bad request body' }, { status: 400 }),
    );
  }
}
