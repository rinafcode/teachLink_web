import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import {
  appSettingsSchema,
  createDefaultSettings,
  type AppSettings,
  SettingsService,
  SettingsStorePersistedShape,
} from '@/lib/settings';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * Ephemeral server-side store for syncing settings across devices for a given sync key.
 * Replace with persistent DB (PostgreSQL, KV, etc.) in production deployments.
 */
const remoteSettingsDb = new Map<string, SettingsStorePersistedShape>();

const putBodySchema = z.object({
  userId: z.string().min(1).max(256),
  settings: appSettingsSchema,
  updatedAt: z.number().int(),
});

export async function GET(request: Request) {
  edgeLog('info', '/api/user/settings', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId?.trim()) {
    const defaultState = SettingsService.createStoreState(createDefaultSettings());
    return addHeaders(
      NextResponse.json(
        {
          success: false,
          message: 'userId query parameter is required',
          data: { settings: defaultState.settings, updatedAt: defaultState.updatedAt },
        },
        { status: 400 },
      ),
    );
  }

  const row = remoteSettingsDb.get(userId);
  if (!row) {
    const defaultState = SettingsService.createStoreState(createDefaultSettings());
    return addHeaders(
      NextResponse.json(
        {
          success: false,
          message: 'No remote settings saved yet',
          data: { settings: defaultState.settings, updatedAt: defaultState.updatedAt },
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
  edgeLog('info', '/api/user/settings', 'PUT request received');
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

    // Validate settings using service layer
    const validation = SettingsService.validateSettings(settings);
    if (!validation.valid) {
      return addHeaders(
        NextResponse.json(
          {
            success: false,
            message: 'Invalid settings',
            errors: validation.errors,
          },
          { status: 400 },
        ),
      );
    }

    // Create store state with proper timestamps
    const storeState = SettingsService.createStoreState(settings);
    remoteSettingsDb.set(userId, storeState);

    return addHeaders(
      NextResponse.json({
        success: true,
        message: 'Settings saved.',
        data: { settings, updatedAt: storeState.updatedAt },
      }),
    );
  } catch {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Bad request body' }, { status: 400 }),
    );
  }
}
