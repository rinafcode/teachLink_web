import { NextResponse } from 'next/server';
import type { VideoNote } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { edgeLog } from '@/../infra/edge-config';

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

export const runtime = 'edge';

const notesStore = new Map<string, VideoNote[]>();

const keyFor = (userId: string | undefined, lessonId: string): string => {
  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};

export async function GET(request: Request): Promise<NextResponse<NotesListResponseDTO>> {
  edgeLog('info', '/api/notes', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(NotesGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  return addHeaders(
    NextResponse.json({
      data: notesStore.get(keyFor(result.data.userId, result.data.lessonId)) ?? [],
      success: true,
    }),
  );
}

export async function POST(request: Request): Promise<NextResponse<NoteResponseDTO>> {
  edgeLog('info', '/api/notes', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

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

  const response = addHeaders(
    NextResponse.json({
      success: true,
      data: persisted,
    }),
  );

  logAuditMutation(request, {
    action: 'create',
    targetType: 'video-note',
    targetId: persisted.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}

export async function PATCH(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  edgeLog('info', '/api/notes', 'PATCH request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

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
            time: result.data.time ?? n.time,
            updatedAt: now,
          }
        : n,
    ),
  );

  const response = addHeaders(NextResponse.json({ success: true }));
  logAuditMutation(request, {
    action: 'update',
    targetType: 'video-note',
    targetId: result.data.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}

export async function DELETE(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  edgeLog('info', '/api/notes', 'DELETE request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(NotesDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  const key = keyFor(result.data.userId, result.data.lessonId);
  const prev = notesStore.get(key) ?? [];

  notesStore.set(
    key,
    prev.filter((n) => n.id !== result.data.id),
  );

  const response = addHeaders(NextResponse.json({ success: true }));
  logAuditMutation(request, {
    action: 'delete',
    targetType: 'video-note',
    targetId: result.data.id,
    statusCode: response.status,
    metadata: { lessonId: result.data.lessonId },
  });

  return response;
}
