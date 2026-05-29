import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';
import { validateBody } from '@/lib/validation';
import { CourseByIdParamsSchema } from '@/types/api/courses.dto';
import type { CourseResponseDTO } from '@/types/api/courses.dto';
import { getCourseById } from '@/lib/course-config';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<CourseResponseDTO>> {
  edgeLog('info', '/api/courses/[id]', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<CourseResponseDTO>;
  }

  const rawParams = await params;
  const result = validateBody(CourseByIdParamsSchema, rawParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse<CourseResponseDTO>;

  const course = getCourseById(result.data.id);
  if (!course) {
    const notFound = addHeaders(
      NextResponse.json({ data: null as unknown as CourseResponseDTO['data'], success: false, message: 'Course not found' }, { status: 404 }),
    );
    return notFound as NextResponse<CourseResponseDTO>;
  }

  const response = addHeaders(
    NextResponse.json({
      data: course,
      success: true,
    }),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.public);
  return response;
}
