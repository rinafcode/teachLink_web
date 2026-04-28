import { NextResponse } from 'next/server';
import type { VideoNote, ApiResponse, SuccessResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

type PersistedVideoNote = VideoNote;

const notesStore = new Map<string, PersistedVideoNote[]>();

const keyFor = (userId: string | undefined, lessonId: string) => {
  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};

export async function GET(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
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
      data: notesStore.get(keyFor(userId, lessonId)) ?? [],
      success: true,
    }),
  );
}

export async function POST(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    note: { id?: string; time: number; text: string };
  };

  if (!body?.lessonId || !body?.note?.time || !body?.note?.text) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }

  const now = new Date().toISOString();
  const id = body.note.id ?? `note-${Date.now()}`;
  const persisted: PersistedVideoNote = {
    id,
    time: Math.max(0, body.note.time),
    text: body.note.text.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const key = keyFor(body.userId, body.lessonId);
  const prev = notesStore.get(key) ?? [];
  const next = [persisted, ...prev.filter((n) => n.id !== persisted.id)];
  notesStore.set(key, next);

  return addHeaders(NextResponse.json({ success: true, data: persisted }));
}

export async function PATCH(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    id: string;
    text: string;
    time?: number;
  };

  if (!body?.lessonId || !body?.id || !body?.text) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }

  const key = keyFor(body.userId, body.lessonId);
  const prev = notesStore.get(key) ?? [];
  const now = new Date().toISOString();

  const next = prev.map((n) =>
    n.id === body.id
      ? {
          ...n,
          text: body.text.trim(),
          time: typeof body.time === 'number' ? Math.max(0, body.time) : n.time,
          updatedAt: now,
        }
      : n,
  );

  notesStore.set(key, next);
  return addHeaders(NextResponse.json({ success: true }));
}

export async function DELETE(request: Request) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  const body = (await request.json()) as { userId?: string; lessonId: string; id: string };
  if (!body?.lessonId || !body?.id) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }

  const key = keyFor(body.userId, body.lessonId);
  const prev = notesStore.get(key) ?? [];
  notesStore.set(
    key,
    prev.filter((n) => n.id !== body.id),
  );

  return addHeaders(NextResponse.json({ success: true }));
}
