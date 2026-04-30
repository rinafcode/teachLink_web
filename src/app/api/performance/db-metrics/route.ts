import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db/pool';

/**
 * API endpoint to expose database connection pool metrics
 * Used by the monitoring system to track resource usage.
 */
export async function GET() {
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
