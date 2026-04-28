import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const metric = await request.json();

    // Log the received metric
    console.log('[Performance Analytics] Received metric:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: new Date(metric.timestamp).toISOString(),
    });

    // Implement alerting logic
    if (metric.rating === 'poor') {
      console.warn(
        `[PERFORMANCE ALERT] Critical degradation detected for ${metric.name} on ${metric.url}. Value: ${metric.value}`,
      );
      // In a real app, this could trigger a Slack notification, PagerDuty, etc.
    } else if (metric.rating === 'needs-improvement') {
      console.info(
        `[PERFORMANCE WARNING] ${metric.name} needs improvement on ${metric.url}. Value: ${metric.value}`,
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
    console.error('[Performance Analytics] Error processing metric:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
