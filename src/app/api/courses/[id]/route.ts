import { NextResponse } from 'next/server';
import type { Course, ApiResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Course>>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<Course>>;
  }

  const { id } = await params;
  const course = {
    id,
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

  return addHeaders(
    NextResponse.json({
      data: course,
      success: true,
    }),
  );
}
