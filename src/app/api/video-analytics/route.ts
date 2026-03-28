import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    lessonId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  };

  if (!body?.lessonId || !body?.eventType) {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }

  const event: AnalyticsEvent = {
    userId: body.userId,
    lessonId: body.lessonId,
    eventType: body.eventType,
    payload: body.payload ?? {},
  };

  const key = keyFor(body.userId, body.lessonId);
  const prev = analyticsStore.get(key) ?? [];
  analyticsStore.set(key, [event, ...prev].slice(0, 1000)); // cap for memory safety

  return NextResponse.json({ success: true });
}
