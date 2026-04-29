import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';

import { validateBody } from '@/lib/validation';
import { LoginRequestSchema } from '@/types/api/auth.dto';
import type { AuthResponseDTO, AuthErrorDTO } from '@/types/api/auth.dto';

import type { AuthResponse } from '@/types/api';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'edge';


// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------


export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuthResponseDTO | AuthErrorDTO>> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;
export async function POST(request: NextRequest) {
  edgeLog('info', '/api/auth/login', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'AUTH');
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<{ message: string }>;
  }


  const result = validateBody(LoginRequestSchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse;


  const { email, password } = result.data;

    // Mock validation
    if (!email || !password) {
      return addHeaders(
        NextResponse.json({ message: 'Email and password are required' }, { status: 400 }),
      ) as NextResponse<{ message: string }>;
    }



  // Mock: demo credentials
  if (email === 'demo@teachlink.com' && password === 'password123') {
    return addHeaders(
      NextResponse.json(
        {
          message: 'Login successful',
          user: { id: '1', name: 'Demo User', email },
          token: `mock-jwt-token-${Date.now()}`,
        },
        { status: 200 },
      ),
    );
  }

  // Mock: accept any valid email + password >= 6 chars
  if (password.length >= 6) {
    return addHeaders(
      NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: Math.random().toString(36).substring(2, 9),
            name: email.split('@')[0],
            email,
          },
          token: `mock-jwt-token-${Date.now()}`,
        },
        { status: 200 },
      ),
    );

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

  return addHeaders(NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }));
}
