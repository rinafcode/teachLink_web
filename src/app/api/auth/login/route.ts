import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication - check for demo credentials
    if (email === 'demo@teachlink.com' && password === 'password123') {
      // Simulate successful login
      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: '1',
            name: 'Demo User',
            email: email,
          },
          token: 'mock-jwt-token-' + Date.now(),
        },
        { status: 200 }
      );
    }

    // Mock: Accept any valid email format with password length >= 6
    if (password.length >= 6) {
      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email: email,
          },
          token: 'mock-jwt-token-' + Date.now(),
        },
        { status: 200 }
      );
    }

    // Invalid credentials
    return NextResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
