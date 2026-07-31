import { getCsrfTokenFromCookies, getCsrfTokenFromHeaders } from '@/lib/csrfMiddleware';
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

import * as notesRepo from '@/lib/db/repositories/notes.repository';

// ---------------------------------------------------------------------------
// GET /api/notes
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<NotesListResponseDTO>> {
  edgeLog('info', '/api/notes', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(NotesGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    const notes = await notesRepo.findByUserAndLesson(result.data.userId, result.data.lessonId);
    return addHeaders(
      NextResponse.json({
        data: notes,
        success: true,
      }),
    );
  } catch (error) {
    edgeLog('error', '/api/notes', 'Database error in GET', { error });
    return addHeaders(
      NextResponse.json(
        { data: [], success: false, message: 'Internal server error' },
        { status: 500 },
      ),
    ) as NextResponse;
  }
}

// ---------------------------------------------------------------------------
// POST /api/notes
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<NoteResponseDTO>> {
  edgeLog('info', '/api/notes', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  // CSRF validation
  const cookieToken = getCsrfTokenFromCookies(request as any);
  const headerToken = getCsrfTokenFromHeaders(request as any);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'CSRF token validation failed' },
        { status: 403 }
      )
    ) as NextResponse;
  }

  const result = validateBody(NotesCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    const noteData = {
      id: result.data.note.id ?? `note-${Date.now()}`,
      time: result.data.note.time,
      text: result.data.note.text,
    };

    const persisted = await notesRepo.create(result.data.userId, result.data.lessonId, noteData);

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
  } catch (error) {
    edgeLog('error', '/api/notes', 'Database error in POST', { error });
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Internal server error' } as unknown as NoteResponseDTO,
        { status: 500 },
      ),
    ) as NextResponse;
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/notes
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  edgeLog('info', '/api/notes', 'PATCH request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  // CSRF validation
  const cookieToken = getCsrfTokenFromCookies(request as any);
  const headerToken = getCsrfTokenFromHeaders(request as any);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'CSRF token validation failed' },
        { status: 403 }
      )
    ) as NextResponse;
  }

  const result = validateBody(NotesPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    await notesRepo.update(result.data.id, result.data.userId, result.data.lessonId, {
      text: result.data.text,
      time: result.data.time,
    });

    const response = addHeaders(NextResponse.json({ success: true }));
    logAuditMutation(request, {
      action: 'update',
      targetType: 'video-note',
      targetId: result.data.id,
      statusCode: response.status,
      metadata: { lessonId: result.data.lessonId },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/notes', 'Database error in PATCH', { error });
    return addHeaders(
      NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/notes
// ---------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<NotesSuccessResponseDTO>> {
  edgeLog('info', '/api/notes', 'DELETE request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  // CSRF validation
  const cookieToken = getCsrfTokenFromCookies(request as any);
  const headerToken = getCsrfTokenFromHeaders(request as any);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'CSRF token validation failed' },
        { status: 403 }
      )
    ) as NextResponse;
  }

  const result = validateBody(NotesDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    await notesRepo.remove(result.data.id, result.data.userId, result.data.lessonId);

    const response = addHeaders(NextResponse.json({ success: true }));
    logAuditMutation(request, {
      action: 'delete',
      targetType: 'video-note',
      targetId: result.data.id,
      statusCode: response.status,
      metadata: { lessonId: result.data.lessonId },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/notes', 'Database error in DELETE', { error });
    return addHeaders(
      NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 }),
    );
  }
}
