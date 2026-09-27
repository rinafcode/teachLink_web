import { NextResponse } from 'next/server';

/**
 * API endpoint to expose Zoom integration performance metrics.
 * Used by the monitoring system to track Zoom Web Client SDK and API quality.
 */
export async function GET() {
  try {
    // Generate simulated metrics that vary realistically over time
    const apiLatency = Math.floor(120 + Math.random() * 200); // 120ms to 320ms
    const errorRate = Number((Math.random() * 2).toFixed(2)); // 0% to 2%
    const sdkLoadTime = Math.floor(950 + Math.random() * 600); // 950ms to 1550ms
    const jitter = Math.floor(4 + Math.random() * 12); // 4ms to 16ms
    const packetLoss = Number((Math.random() * 1.2).toFixed(2)); // 0% to 1.2%

    return NextResponse.json({
      success: true,
      data: [
        {
          name: 'zoom_api_latency',
          value: apiLatency,
          unit: 'ms',
          timestamp: Date.now(),
        },
        {
          name: 'zoom_api_error_rate',
          value: errorRate,
          unit: '%',
          timestamp: Date.now(),
        },
        {
          name: 'zoom_sdk_load_time',
          value: sdkLoadTime,
          unit: 'ms',
          timestamp: Date.now(),
        },
        {
          name: 'zoom_connection_jitter',
          value: jitter,
          unit: 'ms',
          timestamp: Date.now(),
        },
        {
          name: 'zoom_packet_loss',
          value: packetLoss,
          unit: '%',
          timestamp: Date.now(),
        },
      ],
    });
  } catch (error) {
    console.error('Failed to fetch Zoom metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Zoom integration metrics' },
      { status: 500 },
    );
  }
}
