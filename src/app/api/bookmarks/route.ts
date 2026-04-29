import { NextResponse } from 'next/server';
import type { VideoBookmark } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

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

// ---------------------------------------------------------------------------
// In-memory store (replace with DB layer)
// ---------------------------------------------------------------------------

const bookmarksStore = new Map<string, VideoBookmark[]>();

const keyFor = (userId: string | undefined, lessonId: string): string => {

import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

type PersistedVideoBookmark = VideoBookmark;

const bookmarksStore = new Map<string, PersistedVideoBookmark[]>();

const keyFor = (userId: string | undefined, lessonId: string) => {

  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};


// ---------------------------------------------------------------------------
// GET /api/bookmarks?lessonId=&userId=
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
): Promise<NextResponse<BookmarksListResponseDTO | BookmarksSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(BookmarksGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function GET(request: Request) {
  edgeLog('info', '/api/bookmarks', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<
      ApiResponse<PersistedVideoBookmark[]> | SuccessResponse
    >;
  }

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  const userId = searchParams.get('userId') ?? undefined;

  if (!lessonId) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'lessonId is required' }, { status: 400 }),
    );
  }


  return addHeaders(
    NextResponse.json({
      data: bookmarksStore.get(keyFor(result.data.userId, result.data.lessonId)) ?? [],
      success: true,
    }),
  );
}


// ---------------------------------------------------------------------------
// POST /api/bookmarks
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<BookmarkResponseDTO | BookmarksSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function POST(request: Request) {
  edgeLog('info', '/api/bookmarks', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<PersistedVideoBookmark> | SuccessResponse>;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    bookmark: { id?: string; time: number; title: string; note?: string };
  };

  if (!body?.lessonId || !body?.bookmark?.time || !body?.bookmark?.title) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }


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

  return addHeaders(NextResponse.json({ success: true, data: persisted }));
}


// ---------------------------------------------------------------------------
// PATCH /api/bookmarks
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function PATCH(request: Request) {
  edgeLog('info', '/api/bookmarks', 'PATCH request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<SuccessResponse>;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    id: string;
    title: string;
    note?: string;
    time?: number;
  };

  if (!body?.lessonId || !body?.id || !body?.title) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }


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
            time: result.data.time !== undefined ? result.data.time : b.time,
            updatedAt: now,
          }
        : b,
    ),
  );

  return addHeaders(NextResponse.json({ success: true }));
}


// ---------------------------------------------------------------------------
// DELETE /api/bookmarks
// ---------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function DELETE(request: Request) {
  edgeLog('info', '/api/bookmarks', 'DELETE request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<SuccessResponse>;
  }

  const body = (await request.json()) as { userId?: string; lessonId: string; id: string };
  if (!body?.lessonId || !body?.id) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }


  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = bookmarksStore.get(key) ?? [];
  bookmarksStore.set(
    key,
    prev.filter((b) => b.id !== result.data.id),
  );

  return addHeaders(NextResponse.json({ success: true }));
}
