import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Mock single course data
  const course = {
    id: params.id,
    title: 'Web3 UX Design Principles',
    description: 'Create intuitive interfaces for decentralized applications',
    instructor: 'Sarah Johnson',
    duration: '24 hours',
    totalLessons: 12,
    progress: 68,
    size: '250MB',
    thumbnailUrl: 'https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg',
    downloaded: false
  };

  return NextResponse.json({
    data: course,
    success: true
  });
}