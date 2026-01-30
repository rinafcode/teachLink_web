import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Mock lessons data
  const lessons = [
    {
      id: '1',
      title: 'Introduction to Web3 UX',
      description: 'Learn the fundamentals of Web3 user experience design',
      duration: '15:30',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      completed: true
    },
    {
      id: '2',
      title: 'Wallet Integration Patterns',
      description: 'Best practices for wallet connections and user onboarding',
      duration: '22:15',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      completed: true
    },
    {
      id: '3',
      title: 'Gas Optimization UX',
      description: 'Designing for minimal transaction costs and better user experience',
      duration: '18:45',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      completed: false
    }
  ];

  return NextResponse.json({
    data: lessons,
    success: true
  });
}