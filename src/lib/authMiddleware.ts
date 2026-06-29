import { NextRequest, NextResponse } from 'next/server';

/**
 * Checks for authentication via Bearer token or internal API secret.
 * Returns a 401 response if neither is valid, or null if authorized.
 * Usage: const unauth = requireAuth(request); if (unauth) return unauth;
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const internalToken = request.headers.get('x-internal-token');
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (internalToken && internalSecret && internalToken === internalSecret) {
    return null;
  }

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
