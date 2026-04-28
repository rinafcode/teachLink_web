import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id } = await params;
  const body = await request.json();

  return addHeaders(
    NextResponse.json({
      success: true,
      message: 'Lesson progress updated successfully',
      data: {
        lessonId: id,
        completed: body.completed,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
