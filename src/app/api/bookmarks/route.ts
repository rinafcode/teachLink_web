import { NextResponse } from 'next/server';
import type { VideoBookmark } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { edgeLog } from '@/../infra/edge-config';

import { validateBody, validateQuery } from '@/lib/validation';
import {
  BookmarksGetQuerySchema,
  BookmarksCreateBodySchema,
  BookmarksPatchBodySchema,
  BookmarksDeleteBodySchema,
} from '@/types/api/bookmarks.dto';
import type {
  BookmarksListResponseDTO,
  BookmarkResponseDTO,
  BookmarksSuccessResponseDTO,
} from '@/types/api/bookmarks.dto';

export const runtime = 'edge';

const bookmarksStore = new Map<string, VideoBookmark[]>();

const keyFor = (userId: string | undefined, lessonId: string): string => {
  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};

export async function GET(request: Request): Promise<NextResponse<BookmarksListResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(BookmarksGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  return addHeaders(
    NextResponse.json({
      data: bookmarksStore.get(keyFor(result.data.userId, result.data.lessonId)) ?? [],
      success: true,
    }),
  );
}

export async function POST(request: Request): Promise<NextResponse<BookmarkResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  const now = new Date().toISOString();

  const persisted: VideoBookmark = {
    id: result.data.bookmark.id ?? `bookmark-${Date.now()}`,
    time: result.data.bookmark.time,
    title: result.data.bookmark.title,
    note: result.data.bookmark.note,
    createdAt: now,
    updatedAt: now,
  };

  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = bookmarksStore.get(key) ?? [];

  bookmarksStore.set(key, [persisted, ...prev.filter((b) => b.id !== persisted.id)]);

  const response = addHeaders(
    NextResponse.json({
      success: true,
      data: persisted,
    }),
  );

  logAuditMutation(request, {
    action: 'create',
    targetType: 'video-bookmark',
    targetId: persisted.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}

export async function PATCH(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'PATCH request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = bookmarksStore.get(key) ?? [];
  const now = new Date().toISOString();

  bookmarksStore.set(
    key,
    prev.map((b) =>
      b.id === result.data.id
        ? {
            ...b,
            title: result.data.title,
            note: result.data.note,
            time: result.data.time ?? b.time,
            updatedAt: now,
          }
        : b,
    ),
  );

  const response = addHeaders(NextResponse.json({ success: true }));
  logAuditMutation(request, {
    action: 'update',
    targetType: 'video-bookmark',
    targetId: result.data.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}

export async function DELETE(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'DELETE request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = bookmarksStore.get(key) ?? [];

  bookmarksStore.set(
    key,
    prev.filter((b) => b.id !== result.data.id),
  );

  const response = addHeaders(NextResponse.json({ success: true }));
  logAuditMutation(request, {
    action: 'delete',
    targetType: 'video-bookmark',
    targetId: result.data.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}
