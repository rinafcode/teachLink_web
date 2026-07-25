import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';
import { validateQuery } from '@/lib/validation';
import { CourseListQuerySchema } from '@/types/api/courses.dto';
import type { CourseListResponseDTO } from '@/types/api/courses.dto';
import {
  withSecurityHeaders,
  validateQuerySafety,
  createSecurityErrorResponse,
  sanitizeObject,
} from '@/lib/security';

export const runtime = 'edge';

export async function GET(request: Request): Promise<NextResponse<CourseListResponseDTO>> {
  edgeLog('info', '/api/courses', 'GET request received');

  // Security: validate query parameters for injection attempts
  const { searchParams } = new URL(request.url);
  const safetyCheck = validateQuerySafety(searchParams);
  if (!safetyCheck.safe) {
    edgeLog('warn', '/api/courses', 'Blocked suspicious request', {
      reason: safetyCheck.reason,
    });
    return withSecurityHeaders(
      createSecurityErrorResponse(safetyCheck.reason || 'Invalid request'),
    ) as NextResponse<CourseListResponseDTO>;
  }

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return withSecurityHeaders(rateLimitResponse) as NextResponse<CourseListResponseDTO>;
  }

  const result = validateQuery(CourseListQuerySchema, searchParams);
  if (!result.ok)
    return withSecurityHeaders(addHeaders(result.error)) as NextResponse<CourseListResponseDTO>;
  const { limit, cursor } = result.data as { limit: number; cursor?: string };

  const paginated = getPaginatedCourses(limit, cursor, { featured });

  const sanitizedPage = sanitizeObject(page);

  const response = withSecurityHeaders(
    addHeaders(
      NextResponse.json({
        data: sanitizedPage,
        total: courses.length,
        nextCursor,
      }),
    ),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.public);
  return response;
}
