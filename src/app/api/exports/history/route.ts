/**
 * Export History API
 * GET /api/exports/history - Get export history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHistoryByUser } from '@/lib/export-scheduler';

// Mock user ID - in production, get from auth session
const getCurrentUserId = (): string => 'user-123';

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const history = await getHistoryByUser(userId, limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
