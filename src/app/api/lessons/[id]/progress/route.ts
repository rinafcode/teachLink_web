import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/lessons/[id]/progress', 'PATCH request received');
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
