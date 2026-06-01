import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateBody } from '@/lib/validation';
import { edgeLog } from '@/../infra/edge-config';
import { UpdateProgressSchema } from '@/types/api/tutorials.dto';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// PATCH /api/tutorials/[id]/progress
// ---------------------------------------------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  edgeLog('info', '/api/tutorials/[id]/progress', 'PATCH request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  const result = validateBody(UpdateProgressSchema, await request.json());
  if (!result.ok) return addHeaders(result.error);

  const { completed, progressPercent } = result.data;

  return addHeaders(
    NextResponse.json({
      success: true,
      message: 'Tutorial progress updated successfully',
      data: {
        tutorialId: id,
        completed,
        progressPercent: progressPercent ?? (completed ? 100 : 0),
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
