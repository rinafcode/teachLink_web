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

import * as bookmarksRepo from '@/lib/db/repositories/bookmarks.repository';

// ---------------------------------------------------------------------------
// GET /api/bookmarks
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<BookmarksListResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(BookmarksGetQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    const bookmarks = await bookmarksRepo.findByUserAndLesson(
      result.data.userId,
      result.data.lessonId,
    );
    return addHeaders(
      NextResponse.json({
        data: bookmarks,
        success: true,
      }),
    );
  } catch (error) {
    edgeLog('error', '/api/bookmarks', 'Database error in GET', { error });
    return addHeaders(
      NextResponse.json(
        { data: [], success: false, message: 'Internal server error' },
        { status: 500 },
      ),
    ) as NextResponse;
  }
}

// ---------------------------------------------------------------------------
// POST /api/bookmarks
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<BookmarkResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksCreateBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    const bookmarkData = {
      id: result.data.bookmark.id ?? `bookmark-${Date.now()}`,
      time: result.data.bookmark.time,
      title: result.data.bookmark.title,
      note: result.data.bookmark.note,
    };

    const persisted = await bookmarksRepo.create(
      result.data.userId,
      result.data.lessonId,
      bookmarkData,
    );

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
  } catch (error) {
    edgeLog('error', '/api/bookmarks', 'Database error in POST', { error });
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Internal server error' } as unknown as BookmarkResponseDTO,
        { status: 500 },
      ),
    ) as NextResponse;
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/bookmarks
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'PATCH request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksPatchBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    await bookmarksRepo.update(result.data.id, result.data.userId, result.data.lessonId, {
      title: result.data.title,
      note: result.data.note,
      time: result.data.time,
    });

    const response = addHeaders(NextResponse.json({ success: true }));
    logAuditMutation(request, {
      action: 'update',
      targetType: 'video-bookmark',
      targetId: result.data.id,
      statusCode: response.status,
      metadata: { lessonId: result.data.lessonId },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/bookmarks', 'Database error in PATCH', { error });
    return addHeaders(
      NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/bookmarks
// ---------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<BookmarksSuccessResponseDTO>> {
  edgeLog('info', '/api/bookmarks', 'DELETE request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const result = validateBody(BookmarksDeleteBodySchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;

  try {
    await bookmarksRepo.remove(result.data.id, result.data.userId, result.data.lessonId);

    const response = addHeaders(NextResponse.json({ success: true }));
    logAuditMutation(request, {
      action: 'delete',
      targetType: 'video-bookmark',
      targetId: result.data.id,
      statusCode: response.status,
      metadata: { lessonId: result.data.lessonId },
    });

    return response;
  } catch (error) {
    edgeLog('error', '/api/bookmarks', 'Database error in DELETE', { error });
    return addHeaders(
      NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 }),
    );
  }
}
