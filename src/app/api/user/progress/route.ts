import { NextResponse } from 'next/server';
import type { ApiResponse, UserProgress } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

export async function GET(request: Request) {
  edgeLog('info', '/api/user/progress', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<UserProgress>>;
  }

  return addHeaders(
    NextResponse.json({
      success: true,
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

export async function POST(request: Request) {
  edgeLog('info', '/api/user/progress', 'POST request received');
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
