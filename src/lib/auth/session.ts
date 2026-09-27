import { cookies, headers } from 'next/headers';
import { verifyToken } from './jwt';
import type { UserRole } from '@/types/api';

/**
 * Minimal authenticated-user shape derived from a verified JWT session.
 * Kept intentionally small — it only carries claims the token actually has.
 */
export interface SessionUser {
  id: string;
  email?: string;
  role: UserRole;
}

/**
 * Resolves the currently authenticated user for a Server Component or Route
 * Handler.
 *
 * Uses the same token precedence as `src/middleware.ts` (Authorization
 * header first, falling back to an `Authorization` cookie) so a single
 * source of truth governs how a session is recognized across the app.
 * Returns `null` when there is no valid session — callers must render a
 * signed-out/guest state rather than fabricate a user identity.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);

  const authHeader = headerStore.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '') ?? cookieStore.get('Authorization')?.value;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
