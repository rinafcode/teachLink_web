import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Mock validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords don't match" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Mock: Check if email already exists (demo only)
    if (email === 'existing@teachlink.com') {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Simulate successful signup
    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          email: email,
        },
        token: 'mock-jwt-token-' + Date.now(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
