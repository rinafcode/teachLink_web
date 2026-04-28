import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';

import { validateBody } from '@/lib/validation';
import { CourseByIdParamsSchema } from '@/types/api/courses.dto';
import type { CourseResponseDTO } from '@/types/api/courses.dto';

// ---------------------------------------------------------------------------
// GET /api/courses/[id]
// ---------------------------------------------------------------------------


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<CourseResponseDTO>> {

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {


import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';

export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  edgeLog('info', '/api/courses/[id]', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<CourseResponseDTO>;
  }

  const rawParams = await params;
  const result = validateBody(CourseByIdParamsSchema, rawParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse<CourseResponseDTO>;

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

  const response = addHeaders(
    NextResponse.json({
      data: course,
      success: true,
    }),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.public);
  return response;
}
