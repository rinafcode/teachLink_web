import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { formatNameFromEmail, getInitials } from '@/lib/auth/userProfile';
import { profileUser as defaultProfileUser, ProfileUser } from '@/app/profile/profile-data';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory store for session profile updates during dev/runtime
const userProfilesStore = new Map<string, ProfileUser>();

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return (
    request.cookies.get('Authorization')?.value ??
    request.cookies.get('auth-token')?.value ??
    request.cookies.get('token')?.value ??
    null
  );
}

export async function GET(request: NextRequest) {
  edgeLog('info', '/api/user/profile', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const token = extractToken(request);
  if (!token) {
    return addHeaders(
      NextResponse.json({ success: true, data: defaultProfileUser }),
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return addHeaders(
      NextResponse.json({ success: true, data: defaultProfileUser }),
    );
  }

  const userId = payload.sub;
  const email = payload.email || (userId.includes('@') ? userId : `${userId}@example.com`);

  if (userProfilesStore.has(userId)) {
    return addHeaders(
      NextResponse.json({ success: true, data: userProfilesStore.get(userId) }),
    );
  }

  const name = formatNameFromEmail(email);
  const userProfile: ProfileUser = {
    initials: getInitials(name),
    name,
    email,
    bio: defaultProfileUser.bio,
    learningGoal: defaultProfileUser.learningGoal,
    dailyLearningTime: defaultProfileUser.dailyLearningTime,
    avatarUrl: defaultProfileUser.avatarUrl,
  };

  userProfilesStore.set(userId, userProfile);

  return addHeaders(NextResponse.json({ success: true, data: userProfile }));
}

export async function PUT(request: NextRequest) {
  edgeLog('info', '/api/user/profile', 'PUT request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  try {
    const body = await request.json();
    const token = extractToken(request);
    let userId = 'default-user';

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.sub;
      }
    }

    const current = userProfilesStore.get(userId) || {
      ...defaultProfileUser,
      email: body.email || defaultProfileUser.email,
      name: body.name || defaultProfileUser.name,
    };

    const updatedName = body.name ?? current.name;
    const updatedProfile: ProfileUser = {
      ...current,
      name: updatedName,
      initials: getInitials(updatedName),
      email: body.email ?? current.email,
      bio: body.bio ?? current.bio,
      learningGoal: body.learningGoal ?? current.learningGoal,
      dailyLearningTime: body.dailyLearningTime ?? current.dailyLearningTime,
      avatarUrl: body.avatarUrl ?? current.avatarUrl,
    };

    userProfilesStore.set(userId, updatedProfile);

    return addHeaders(
      NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      }),
    );
  } catch (err) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Invalid profile payload', error: String(err) },
        { status: 400 },
      ),
    );
  }
}
