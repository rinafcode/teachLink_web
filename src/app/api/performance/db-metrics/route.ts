import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/db/pool';
import { requireAuth, getUserFromRequest } from '@/lib/authMiddleware';
import { hasPermission } from '@/lib/auth/acl';
import { Permission } from '@/types/api';

/**
 * API endpoint to expose database connection pool metrics
 * Used by the monitoring system to track resource usage.
 * 
 * SECURITY: Requires authentication and ANALYTICS_VIEW permission (ADMIN only)
 */
export async function GET(request: NextRequest) {
  // T4 MITIGATION: Require authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  // Extract user from request
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // T4 MITIGATION: Check for ANALYTICS_VIEW permission (ADMIN only)
  if (!hasPermission(user, Permission.ANALYTICS_VIEW)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const metrics = dbPool.getMetrics();

    return NextResponse.json({
      success: true,
      data: [
        {
          name: 'db_pool_total_connections',
          value: metrics.totalConnections,
          timestamp: Date.now(),
        },
        {
          name: 'db_pool_idle_connections',
          value: metrics.idleConnections,
          timestamp: Date.now(),
        },
        {
          name: 'db_pool_waiting_clients',
          value: metrics.waitingCount,
          timestamp: Date.now(),
        },
        {
          name: 'db_pool_active_connections',
          value: metrics.totalConnections - metrics.idleConnections,
          timestamp: Date.now(),
        },
      ],
    });
  } catch (error) {
    console.error('Failed to fetch DB metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch database metrics' },
      { status: 500 },
    );
  }
}
