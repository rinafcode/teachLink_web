import { NextResponse } from 'next/server';
import type { ApiResponse, LearningProgressItem } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { getAllCourses } from '@/lib/course-config';

export const runtime = 'edge';

export async function GET(request: Request) {
  edgeLog('info', '/api/user/learning-progress', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ApiResponse<LearningProgressItem[]>>;
  }

  const items: LearningProgressItem[] = getAllCourses()
    .filter((course) => course.progress > 0)
    .map((course) => ({
      courseId: course.id,
      title: course.title,
      progress: course.progress,
      timeRemaining: (course.timeRemaining ?? course.duration).replace(/ remaining$/, ''),
      totalLessons: course.totalLessons,
      category: course.category,
    }));

  return addHeaders(
    NextResponse.json({
      success: true,
      data: items,
    }),
  );
}
