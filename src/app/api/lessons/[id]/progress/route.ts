import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  // Mock progress update
  return NextResponse.json({
    success: true,
    message: 'Lesson progress updated successfully',
    data: {
      lessonId: id,
      completed: body.completed,
      updatedAt: new Date().toISOString()
    }
  });
}