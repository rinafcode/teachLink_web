import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';

const profileBodySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be at most 500 characters'),
  location: z.string().max(200).optional(),
  website: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  twitter: z.string().max(100).optional(),
  github: z.string().max(100).optional(),
  linkedin: z.string().max(100).optional(),
});

export async function PUT(request: Request) {
  edgeLog('info', '/api/user/profile', 'PUT request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const json = await request.json();
    const parsed = profileBodySchema.safeParse(json);

    if (!parsed.success) {
      const fieldErrors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return addHeaders(
        NextResponse.json(
          { success: false, message: 'Validation failed', errors: fieldErrors },
          { status: 400 },
        ),
      );
    }

    return addHeaders(
      NextResponse.json({
        success: true,
        data: {
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  } catch {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Bad request body' }, { status: 400 }),
    );
  }
}
