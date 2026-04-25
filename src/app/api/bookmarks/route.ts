import { NextResponse } from 'next/server';
import type { VideoBookmark, ApiResponse, SuccessResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

type PersistedVideoBookmark = VideoBookmark;

const bookmarksStore = new Map<string, PersistedVideoBookmark[]>();

const keyFor = (userId: string | undefined, lessonId: string) => {
  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};

export async function GET(request: Request): Promise<NextResponse<ApiResponse<PersistedVideoBookmark[]> | SuccessResponse>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  const userId = searchParams.get('userId') ?? undefined;

  if (!lessonId) {
    return addHeaders(NextResponse.json({ success: false, message: 'lessonId is required' }, { status: 400 }));
  }

  return addHeaders(
    NextResponse.json({
      data: bookmarksStore.get(keyFor(userId, lessonId)) ?? [],
      success: true,
    }),
  );
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<PersistedVideoBookmark> | SuccessResponse>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    bookmark: { id?: string; time: number; title: string; note?: string };
  };

  if (!body?.lessonId || !body?.bookmark?.time || !body?.bookmark?.title) {
    return addHeaders(NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }));
  }

  const now = new Date().toISOString();
  const id = body.bookmark.id ?? `bookmark-${Date.now()}`;

  const persisted: PersistedVideoBookmark = {
    id,
    time: Math.max(0, body.bookmark.time),
    title: body.bookmark.title.trim(),
    note: body.bookmark.note?.trim() ? body.bookmark.note.trim() : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const key = keyFor(body.userId, body.lessonId);
  const prev = bookmarksStore.get(key) ?? [];
  const next = [persisted, ...prev.filter((b) => b.id !== persisted.id)];
  bookmarksStore.set(key, next);

  return addHeaders(NextResponse.json({ success: true, data: persisted }));
}

export async function PATCH(request: Request): Promise<NextResponse<SuccessResponse>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
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
    return addHeaders(NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }));
  }

  const key = keyFor(body.userId, body.lessonId);
  const prev = bookmarksStore.get(key) ?? [];
  const now = new Date().toISOString();

  const next = prev.map((b) =>
    b.id === body.id
      ? {
          ...b,
          title: body.title.trim(),
          note: body.note?.trim() ? body.note.trim() : undefined,
          time: typeof body.time === 'number' ? Math.max(0, body.time) : b.time,
          updatedAt: now,
        }
      : b,
  );

  bookmarksStore.set(key, next);
  return addHeaders(NextResponse.json({ success: true }));
}

export async function DELETE(request: Request): Promise<NextResponse<SuccessResponse>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const body = (await request.json()) as { userId?: string; lessonId: string; id: string };
  if (!body?.lessonId || !body?.id) {
    return addHeaders(NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }));
  }

  const key = keyFor(body.userId, body.lessonId);
  const prev = bookmarksStore.get(key) ?? [];
  bookmarksStore.set(
    key,
    prev.filter((b) => b.id !== body.id),
  );

  return addHeaders(NextResponse.json({ success: true }));
}
