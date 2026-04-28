import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

export async function GET(request: Request) {
  edgeLog('info', '/api/courses/downloadable', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const courses = [
    {
      id: '1',
      title: 'Web3 UX Design Principles',
      description: 'Create intuitive interfaces for decentralized applications',
      instructor: 'Sarah Johnson',
      duration: '24 hours',
      totalLessons: 12,
      progress: 68,
      size: '250MB',
      thumbnailUrl:
        'https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg',
      downloaded: false,
    },
    {
      id: '2',
      title: 'Smart Contract Security Best Practices',
      description: 'Learn to secure your Cairo smart contracts against vulnerabilities',
      instructor: 'Michael Chen',
      duration: '36 hours',
      totalLessons: 18,
      progress: 45,
      size: '380MB',
      thumbnailUrl:
        'https://static.vecteezy.com/system/resources/previews/053/715/379/non_2x/abstract-green-digital-rain-with-matrix-code-in-futuristic-cyber-background-perfect-for-technology-and-data-themed-visuals-png.png',
      downloaded: false,
    },
  ];

  return addHeaders(
    NextResponse.json({
      data: courses,
      success: true,
    }),
  );
}
