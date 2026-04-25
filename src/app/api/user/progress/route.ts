import { NextResponse } from 'next/server';
import type { ApiResponse, UserProgress } from '@/types/api';

export async function GET(): Promise<NextResponse<ApiResponse<UserProgress>>> {
  // Mock user progress data
  return NextResponse.json({
    success: true,
    data: {
      streak: 7,
      totalTimeSpent: 1245, // minutes
      dailyGoal: 30, // minutes
      lastActive: new Date().toISOString(),
      completedCourses: 2,
      totalCourses: 8,
    },
  });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<UserProgress>>> {
  const body = await request.json();

  // Mock progress update
  return NextResponse.json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      ...body,
      updatedAt: new Date().toISOString(),
    },
  });
}
