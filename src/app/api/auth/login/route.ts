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
    const { email, password } = body;

    // Mock validation
    if (!email || !password) {
      return addHeaders(
        NextResponse.json({ message: 'Email and password are required' }, { status: 400 }),
      ) as NextResponse<{ message: string }>;
    }

    // Mock authentication - check for demo credentials
    if (email === 'demo@teachlink.com' && password === 'password123') {
      // Simulate successful login
      return addHeaders(
        NextResponse.json(
          {
            message: 'Login successful',
            user: {
              id: '1',
              name: 'Demo User',
              email: email,
            },
            token: 'mock-jwt-token-' + Date.now(),
          },
          { status: 200 },
        ),
      ) as NextResponse<AuthResponse>;
    }

    // Mock: Accept any valid email format with password length >= 6
    if (password.length >= 6) {
      return addHeaders(
        NextResponse.json(
          {
            message: 'Login successful',
            user: {
              id: Math.random().toString(36).substr(2, 9),
              name: email.split('@')[0],
              email: email,
            },
            token: 'mock-jwt-token-' + Date.now(),
          },
          { status: 200 },
        ),
      ) as NextResponse<AuthResponse>;
    }

    // Invalid credentials
    return addHeaders(
      NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }),
    ) as NextResponse<{ message: string }>;
  } catch (error) {
    console.error('Login error:', error);
    return addHeaders(
      NextResponse.json({ message: 'Internal server error' }, { status: 500 }),
    ) as NextResponse<{ message: string }>;
  }
}
