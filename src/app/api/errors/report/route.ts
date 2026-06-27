import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';

const logger = createLogger('errors.report');

// External error tracking service configuration
const ERROR_TRACKING_URL = process.env.ERROR_TRACKING_URL;
const ERROR_TRACKING_API_KEY = process.env.ERROR_TRACKING_API_KEY;

/**
 * Send error to external tracking service (e.g., Sentry, LogRocket, DataDog)
 */
async function sendToExternalService(report: any): Promise<void> {
  if (!ERROR_TRACKING_URL) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (ERROR_TRACKING_API_KEY) {
      headers['Authorization'] = `Bearer ${ERROR_TRACKING_API_KEY}`;
      headers['X-API-Key'] = ERROR_TRACKING_API_KEY;
    }

    const response = await fetch(ERROR_TRACKING_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...report,
        source: 'teachLink-web',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      logger.warn('Failed to send error to external service', {
        context: {
          status: response.status,
          statusText: response.statusText,
          service: ERROR_TRACKING_URL,
        },
      });
    } else {
      logger.info('Error sent to external service successfully', {
        context: { reportId: report.id, service: ERROR_TRACKING_URL },
      });
    }
  } catch (error) {
    logger.error('Error sending to external tracking service', {
      error,
      context: { service: ERROR_TRACKING_URL },
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const report = await request.json();

    // Build a real Error so normalizeError captures name + message + stack properly
    const clientError = report.errorData?.message
      ? Object.assign(new Error(report.errorData.message), {
          name: report.errorData.type ?? 'ClientError',
        })
      : undefined;

    logger.error('Client error report', {
      context: {
        reportId: report.id,
        sessionId: report.sessionId,
        userId: report.userId,
        url: report.url,
        environment: report.environment,
      },
      error: clientError,
    });

    // Send to external error tracking service if configured
    if (ERROR_TRACKING_URL) {
      // Send asynchronously without waiting
      void sendToExternalService(report);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
