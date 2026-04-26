import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the Authorization header and returns a 401 response if missing or invalid.
 * Usage: const unauth = requireAuth(request); if (unauth) return unauth;
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
