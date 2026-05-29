import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { getAllCourses } from '@/lib/course-config';

export const runtime = 'edge';

export async function GET(request: Request) {
  edgeLog('info', '/api/courses/downloadable', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const courses = getAllCourses().map(({ id, title, description, instructor, duration, totalLessons, progress, size, thumbnailUrl }) => ({
    id,
    title,
    description,
    instructor,
    duration,
    totalLessons,
    progress,
    size,
    thumbnailUrl,
    downloaded: false,
  }));

  return addHeaders(
    NextResponse.json({
      data: courses,
      success: true,
    }),
  );
}
