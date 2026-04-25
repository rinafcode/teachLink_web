import { NextResponse } from 'next/server';
import type { ApiResponse, UserProgress } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

export async function GET(): Promise<NextResponse<ApiResponse<UserProgress>>> {
  const mockRequest = new Request('http://localhost');
  const { addHeaders, rateLimitResponse } = withRateLimit(mockRequest, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<UserProgress>>;
  }

  return addHeaders(
    NextResponse.json({
      data: {
        streak: 7,
        totalTimeSpent: 1245,
        dailyGoal: 30,
        lastActive: new Date().toISOString(),
        completedCourses: 2,
        totalCourses: 8,
      },
    }),
  );
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<UserProgress>>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<UserProgress>>;
  }

  const body = await request.json();

  return addHeaders(
    NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        ...body,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
