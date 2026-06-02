import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';
import { validateBody } from '@/lib/validation';
import { CourseByIdParamsSchema } from '@/types/api/courses.dto';
import type { CourseResponseDTO } from '@/types/api/courses.dto';
import {
  withSecurityHeaders,
  validateQuerySafety,
  createSecurityErrorResponse,
  sanitizeObject,
} from '@/lib/security';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<CourseResponseDTO>> {
  edgeLog('info', '/api/courses/[id]', 'GET request received');

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
    edgeLog('warn', '/api/courses/[id]', 'Blocked suspicious request', {
      reason: safetyCheck.reason,
    });
    return withSecurityHeaders(
      createSecurityErrorResponse(safetyCheck.reason || 'Invalid request'),
    ) as NextResponse<CourseResponseDTO>;
  }

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return withSecurityHeaders(rateLimitResponse) as NextResponse<CourseResponseDTO>;
  }

  const result = validateBody(CourseByIdParamsSchema, rawParams);
  if (!result.ok) {
    return withSecurityHeaders(addHeaders(result.error)) as NextResponse<CourseResponseDTO>;
  }

  const course = getCourseById(result.data.id);
  if (!course) {
    const notFound = addHeaders(
      NextResponse.json({ data: null as unknown as CourseResponseDTO['data'], success: false, message: 'Course not found' }, { status: 404 }),
    );
    return notFound as NextResponse<CourseResponseDTO>;
  }

  const sanitizedCourse = sanitizeObject(course);

  const response = withSecurityHeaders(
    addHeaders(
      NextResponse.json({
        data: sanitizedCourse,
        success: true,
      }),
    ),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.public);
  return response;
}
