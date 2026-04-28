import { NextRequest, NextResponse } from 'next/server';
import type { AuthResponse } from '@/types/api';
import { withRateLimit } from '@/lib/ratelimit';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthResponse | { message: string }>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<{ message: string }>;
  }

  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password || !confirmPassword) {
      return addHeaders(
        NextResponse.json({ message: 'All fields are required' }, { status: 400 }),
      ) as NextResponse<{ message: string }>;
    }

    if (password !== confirmPassword) {
      return addHeaders(
        NextResponse.json({ message: "Passwords don't match" }, { status: 400 }),
      ) as NextResponse<{ message: string }>;
    }

    if (password.length < 6) {
      return addHeaders(
        NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 }),
      ) as NextResponse<{ message: string }>;
    }

    if (email === 'existing@teachlink.com') {
      return addHeaders(
        NextResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ) as NextResponse<{ message: string }>;
    }

    return addHeaders(
      NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            email: email,
          },
          token: 'mock-jwt-token-' + Date.now(),
        },
        { status: 201 },
      ),
    ) as NextResponse<AuthResponse>;
  } catch (error) {
    console.error('Signup error:', error);
    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    ) as NextResponse<{ message: string }>;
  }
}
