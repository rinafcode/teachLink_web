import { NextResponse } from 'next/server';
import type { SuccessResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

import * as videoEventsRepo from '@/lib/db/repositories/video-events.repository';

export async function POST(request: Request) {
  edgeLog('info', '/api/video-analytics', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<SuccessResponse>;
  }

  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  };

  if (!body?.lessonId || !body?.eventType) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 }),
    );
  }

  try {
    await videoEventsRepo.create(body.userId, body.lessonId, body.eventType, body.payload ?? {});

    return addHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    edgeLog('error', '/api/video-analytics', 'Database error in POST', { error });
    return addHeaders(
      NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 }),
    );
  }
}
