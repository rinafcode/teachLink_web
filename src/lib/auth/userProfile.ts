import { cookies, headers } from 'next/headers';
import { verifyToken } from './jwt';
import { findUserByEmail } from '@/lib/db/pool';
import type { ProfileUser } from '@/app/profile/profile-data';
import { profileUser as defaultProfileUser } from '@/app/profile/profile-data';

export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format email or username into a human-readable Full Name
 * e.g. "john.doe@example.com" -> "John Doe"
 */
export function formatNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Authenticated User';
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Server-side helper to fetch or construct the profile of the current authenticated user.
 */
export async function getAuthenticatedUserProfile(
  explicitToken?: string | null,
): Promise<ProfileUser> {
  let token = explicitToken;

  if (!token) {
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      if (!token) {
        const cookieStore = await cookies();
        token =
          cookieStore.get('Authorization')?.value ??
          cookieStore.get('auth-token')?.value ??
          cookieStore.get('token')?.value;
      }
    } catch {
      // Called in context where next/headers is not available
    }
  }

  if (!token) {
    return defaultProfileUser;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return defaultProfileUser;
  }

  const email = payload.email || (payload.sub.includes('@') ? payload.sub : `${payload.sub}@example.com`);

  // Try to lookup user record from database pool if available
  let dbUser = null;
  try {
    if (email) {
      dbUser = await findUserByEmail(email);
    }
  } catch {
    // Database query error or pool uninitialized; proceed with token payload
  }

  const name = dbUser?.id ? formatNameFromEmail(email) : (email ? formatNameFromEmail(email) : 'Authenticated User');
  const initials = getInitials(name);

  return {
    initials,
    name,
    email,
    bio: defaultProfileUser.bio,
    learningGoal: defaultProfileUser.learningGoal,
    dailyLearningTime: defaultProfileUser.dailyLearningTime,
    avatarUrl: defaultProfileUser.avatarUrl,
  };
}
