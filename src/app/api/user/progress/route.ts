import { NextResponse } from 'next/server';

export async function GET() {
  // Mock user progress data
  return NextResponse.json({
    data: {
      streak: 7,
      totalTimeSpent: 1245, // minutes
      dailyGoal: 30, // minutes
      lastActive: new Date().toISOString(),
      completedCourses: 2,
      totalCourses: 8
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Mock progress update
  return NextResponse.json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      ...body,
      updatedAt: new Date().toISOString()
    }
  });
}