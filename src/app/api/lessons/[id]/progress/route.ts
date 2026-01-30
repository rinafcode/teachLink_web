import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  // Mock progress update
  return NextResponse.json({
    success: true,
    message: 'Lesson progress updated successfully',
    data: {
      lessonId: params.id,
      completed: body.completed,
      updatedAt: new Date().toISOString()
    }
  });
}