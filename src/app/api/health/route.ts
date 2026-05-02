import { NextResponse } from 'next/server';
import { edgeLog, COLD_START_CONFIG } from '@/../infra/edge-config';

export const runtime = 'edge';

/**
 * Lightweight health check endpoint for edge function monitoring and keep-alive.
 * Used by the platform health checker to optimize cold starts.
 */
export async function GET() {
  edgeLog('info', '/api/health', 'Health check ping received');
  
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      runtime: 'edge',
      config: {
        timeoutMs: COLD_START_CONFIG.timeoutMs,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    },
  );
}
