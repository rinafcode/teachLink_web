import { NextResponse } from 'next/server';
import type { VideoNote } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

import { validateBody, validateQuery } from '@/lib/validation';
import {
  NotesGetQuerySchema,
  NotesCreateBodySchema,
  NotesPatchBodySchema,
  NotesDeleteBodySchema,
} from '@/types/api/notes.dto';
import type {
  NotesListResponseDTO,
  NoteResponseDTO,
  NotesSuccessResponseDTO,
} from '@/types/api/notes.dto';

// ---------------------------------------------------------------------------
// In-memory store (replace with DB layer)
// ---------------------------------------------------------------------------

const notesStore = new Map<string, VideoNote[]>();

const keyFor = (userId: string | undefined, lessonId: string): string => {

import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

type PersistedVideoNote = VideoNote;

const notesStore = new Map<string, PersistedVideoNote[]>();

const keyFor = (userId: string | undefined, lessonId: string) => {

  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};


// ---------------------------------------------------------------------------
// GET /api/notes?lessonId=&userId=
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
): Promise<NextResponse<NotesListResponseDTO | NotesSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(NotesGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function GET(request: Request) {
  edgeLog('info', '/api/notes', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<PersistedVideoNote[]> | SuccessResponse>;
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
      data: notesStore.get(keyFor(result.data.userId, result.data.lessonId)) ?? [],
      success: true,
    }),
  );
}


// ---------------------------------------------------------------------------
// POST /api/notes
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<NoteResponseDTO | NotesSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function POST(request: Request) {
  edgeLog('info', '/api/notes', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<PersistedVideoNote> | SuccessResponse>;
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
  const persisted: VideoNote = {
    id: result.data.note.id ?? `note-${Date.now()}`,
    time: result.data.note.time,
    text: result.data.note.text,
    createdAt: now,
    updatedAt: now,
  };

  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = notesStore.get(key) ?? [];
  notesStore.set(key, [persisted, ...prev.filter((n) => n.id !== persisted.id)]);

  return addHeaders(NextResponse.json({ success: true, data: persisted }));
}


// ---------------------------------------------------------------------------
// PATCH /api/notes
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function PATCH(request: Request) {
  edgeLog('info', '/api/notes', 'PATCH request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<SuccessResponse>;
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


  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = notesStore.get(key) ?? [];
  const now = new Date().toISOString();

  notesStore.set(
    key,
    prev.map((n) =>
      n.id === result.data.id
        ? {
            ...n,
            text: result.data.text,
            time: result.data.time !== undefined ? result.data.time : n.time,
            updatedAt: now,
          }
        : n,
    ),
  );

  return addHeaders(NextResponse.json({ success: true }));
}


// ---------------------------------------------------------------------------
// DELETE /api/notes
// ---------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

export async function DELETE(request: Request) {
  edgeLog('info', '/api/notes', 'DELETE request received');
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
  const prev = notesStore.get(key) ?? [];
  notesStore.set(
    key,
    prev.filter((n) => n.id !== result.data.id),
  );

  return addHeaders(NextResponse.json({ success: true }));
}
