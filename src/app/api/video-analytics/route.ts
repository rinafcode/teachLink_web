import { NextResponse } from 'next/server';
import type { SuccessResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

type AnalyticsEvent = {
  userId?: string;
  lessonId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

const analyticsStore = new Map<string, AnalyticsEvent[]>();

const keyFor = (userId: string | undefined, lessonId: string) => {
  const safeUserId = encodeURIComponent(userId ?? 'anon');
  return `${safeUserId}::${encodeURIComponent(lessonId)}`;
};

export async function POST(request: Request): Promise<NextResponse<SuccessResponse>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
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

  const event: AnalyticsEvent = {
    userId: body.userId,
    lessonId: body.lessonId,
    eventType: body.eventType,
    payload: body.payload ?? {},
  };

  const key = keyFor(body.userId, body.lessonId);
  const prev = analyticsStore.get(key) ?? [];
  analyticsStore.set(key, [event, ...prev].slice(0, 1000));

  return addHeaders(NextResponse.json({ success: true }));
}
