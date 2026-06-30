import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { validateBody } from '@/lib/validation';
import {
  withSecurityHeaders,
  validateQuerySafety,
  validateContentType,
  createSecurityErrorResponse,
  sanitizeObject,
} from '@/lib/security';

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

  // Security: Check Content-Type to protect against simple CSRF/abuse
  if (!validateContentType(request)) {
    return withSecurityHeaders(
      NextResponse.json(
        { success: false, message: 'Content-Type must be application/json' },
        { status: 415 },
      ),
    );
  }

  const rawParams = await params;

  // Security: Validate parameter and query safety for injection attempts
  const { searchParams } = new URL(request.url);
  const paramCheck = new URLSearchParams();
  if (rawParams.id) paramCheck.set('id', rawParams.id);
  for (const [key, val] of searchParams.entries()) {
    paramCheck.set(key, val);
  }

  const safetyCheck = validateQuerySafety(paramCheck);
  if (!safetyCheck.safe) {
    return withSecurityHeaders(
      createSecurityErrorResponse(safetyCheck.reason || 'Invalid request'),
    );
  }

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return withSecurityHeaders(rateLimitResponse);

  const { id: courseId } = rawParams;
  if (!courseId) {
    return withSecurityHeaders(
      addHeaders(
        NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 }),
      ),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withSecurityHeaders(
      addHeaders(
        NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 }),
      ),
    );
  }

  const result = validateBody(EnrollBodySchema, body);
  if (!result.ok) return withSecurityHeaders(addHeaders(result.error));

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

  const sanitizedEnrollment = sanitizeObject(enrollment);

  return withSecurityHeaders(
    addHeaders(NextResponse.json({ success: true, data: sanitizedEnrollment }, { status: 201 })),
  );
}
