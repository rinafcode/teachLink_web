import { NextResponse } from 'next/server';
import { edgeLog } from '@/../infra/edge-config';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api-performance-vitals');

export const runtime = 'edge';

export async function POST(request: Request) {
  edgeLog('info', '/api/performance/vitals', 'POST request received');
  try {
    const metric = await request.json();

    // Log the received metric
    logger.info('[Performance Analytics] Received metric', {
      context: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
        timestamp: new Date(metric.timestamp).toISOString(),
      },
    });

    // Implement alerting logic
    if (metric.rating === 'poor') {
      logger.warn(
        `[PERFORMANCE ALERT] Critical degradation detected for ${metric.name} on ${metric.url}. Value: ${metric.value}`,
        { context: { metric } },
      );
      // In a real app, this could trigger a Slack notification, PagerDuty, etc.
    } else if (metric.rating === 'needs-improvement') {
      logger.info(
        `[PERFORMANCE WARNING] ${metric.name} needs improvement on ${metric.url}. Value: ${metric.value}`,
        { context: { metric } },
      );
    }

    // In a real app, you would store this in a database like PostgreSQL, ClickHouse, or InfluxDB.
    // For this demonstration, we'll just acknowledge receipt.

    return NextResponse.json({
      success: true,
      message: 'Metric received and processed',
      alertTriggered: metric.rating === 'poor',
    });
  } catch (error) {
    logger.error('[Performance Analytics] Error processing metric', { error });
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
