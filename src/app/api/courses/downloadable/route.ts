import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import {
  withSecurityHeaders,
  validateQuerySafety,
  createSecurityErrorResponse,
  sanitizeObject,
} from '@/lib/security';

export const runtime = 'edge';

export async function GET(request: Request) {
  edgeLog('info', '/api/courses/downloadable', 'GET request received');

  // Security: validate query parameters for injection attempts
  const { searchParams } = new URL(request.url);
  const safetyCheck = validateQuerySafety(searchParams);
  if (!safetyCheck.safe) {
    edgeLog('warn', '/api/courses/downloadable', 'Blocked suspicious request', {
      reason: safetyCheck.reason,
    });
    return withSecurityHeaders(
      createSecurityErrorResponse(safetyCheck.reason || 'Invalid request'),
    );
  }

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return withSecurityHeaders(rateLimitResponse);
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

  const sanitizedCourses = sanitizeObject(courses);

  return withSecurityHeaders(
    addHeaders(
      NextResponse.json({
        data: sanitizedCourses,
        success: true,
      }),
    ),
  );
}
