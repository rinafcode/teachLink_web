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

// ---------------------------------------------------------------------------
// GET /api/courses/[id]
// ---------------------------------------------------------------------------

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

  // Mock course lookup — replace with real DB query
  const course = {
    id: result.data.id,
    title: 'Web3 UX Design Principles',
    description: 'Create intuitive interfaces for decentralized applications',
    instructor: 'Sarah Johnson',
    duration: '24 hours',
    totalLessons: 12,
    progress: 68,
    category: 'Design',
    size: '250MB',
    thumbnailUrl:
      'https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg',
    downloaded: false,
  };

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
