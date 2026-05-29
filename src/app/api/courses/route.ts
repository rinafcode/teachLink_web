import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';
import { validateQuery } from '@/lib/validation';
import { CourseListQuerySchema } from '@/types/api/courses.dto';
import type { CourseListResponseDTO } from '@/types/api/courses.dto';
import { getPaginatedCourses } from '@/lib/course-config';

export const runtime = 'edge';

export async function GET(request: Request): Promise<NextResponse<CourseListResponseDTO>> {
  edgeLog('info', '/api/courses', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<CourseListResponseDTO>;
  }

  const { searchParams } = new URL(request.url);
  const result = validateQuery(CourseListQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse<CourseListResponseDTO>;
  const { limit, cursor, featured } = result.data as { limit: number; cursor?: string; featured?: boolean };

  const paginated = getPaginatedCourses(limit, cursor, { featured });

  const response = addHeaders(
    NextResponse.json({
      data: paginated.data,
      total: paginated.total,
      nextCursor: paginated.nextCursor,
    }),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.public);
  return response;
}
