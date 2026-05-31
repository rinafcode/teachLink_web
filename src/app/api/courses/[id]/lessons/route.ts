import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { DUMMY_VIDEO_URL } from '@/constants/media';
import {
  withSecurityHeaders,
  validateQuerySafety,
  createSecurityErrorResponse,
  sanitizeObject,
} from '@/lib/security';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rawParams = await params;

  // Security: Validate parameter and query safety for injection attempts
  const { searchParams } = new URL(request.url);
  const paramCheck = new URLSearchParams();
  if (rawParams.id) paramCheck.set('id', rawParams.id);
  for (const [key, val] of searchParams.entries()) {
    paramCheck.set(key, val);
  }

  const safetyCheck = validateQuerySafety(paramCheck);
  if (!safetyCheck.safe) {
    return withSecurityHeaders(
      createSecurityErrorResponse(safetyCheck.reason || 'Invalid request'),
    );
  }

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return withSecurityHeaders(rateLimitResponse);
  }

  const lessons = [
    {
      id: '1',
      title: 'Introduction to Web3 UX',
      description: 'Learn the fundamentals of Web3 user experience design',
      duration: '15:30',
      videoUrl: DUMMY_VIDEO_URL,
      completed: true,
    },
    {
      id: '2',
      title: 'Wallet Integration Patterns',
      description: 'Best practices for wallet connections and user onboarding',
      duration: '22:15',
      videoUrl: DUMMY_VIDEO_URL,
      completed: true,
    },
    {
      id: '3',
      title: 'Gas Optimization UX',
      description: 'Designing for minimal transaction costs and better user experience',
      duration: '18:45',
      videoUrl: DUMMY_VIDEO_URL,
      completed: false,
    },
  ];

  const sanitizedLessons = sanitizeObject(lessons);

  return withSecurityHeaders(
    addHeaders(
      NextResponse.json({
        data: sanitizedLessons,
        success: true,
      }),
    ),
  );
}
