import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { validateBody } from '@/lib/validation';

export const runtime = 'edge';

const EnrollBodySchema = z.object({
  planId: z.enum(['basic', 'premium'], {
    message: 'planId must be "basic" or "premium"',
  }),
});

const PLAN_PRICES: Record<string, number> = {
  basic: 49.99,
  premium: 99.99,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  edgeLog('info', '/api/courses/[id]/enroll', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const { id: courseId } = await params;
  if (!courseId) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 }),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 }),
    );
  }

  const result = validateBody(EnrollBodySchema, body);
  if (!result.ok) return addHeaders(result.error);

  const { planId } = result.data;

  // TODO: replace with real payment + DB write
  const enrollment = {
    enrollmentId: `enr_${Date.now()}`,
    courseId,
    planId,
    price: PLAN_PRICES[planId],
    enrolledAt: new Date().toISOString(),
    status: 'active',
  };

  return addHeaders(NextResponse.json({ success: true, data: enrollment }, { status: 201 }));
}
