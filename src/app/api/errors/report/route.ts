import { NextRequest, NextResponse } from 'next/server';
import { createLogger, redactObject } from '@/lib/logging';
import { withRateLimit } from '@/lib/ratelimit';

const logger = createLogger('errors.report');

// External error tracking service configuration
const ERROR_TRACKING_URL = process.env.ERROR_TRACKING_URL;
const ERROR_TRACKING_API_KEY = process.env.ERROR_TRACKING_API_KEY;

/**
 * Custom client error class for consistent error handling
 */
class ClientError extends Error {
  constructor(message: string, name: string = 'ClientError') {
    super(message);
    this.name = name;
  }
}

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

  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit per IP — this endpoint is called by client-side JS and is
  // otherwise open to log-flooding DoS. Use the lower REPORTING tier (10/min).
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'REPORTING');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Scrub known PII/sensitive fields (email, password, token, card, ssn,
    // phone, etc.) from the client-submitted payload before it ever reaches
    // the logger, so form state accidentally captured in error reports never
    // ends up in logs or gets shipped to log aggregators.
    const report = redactObject(await request.json());

    // Build a real Error so normalizeError captures name + message + stack properly
    const clientError = report.errorData?.message
      ? new ClientError(report.errorData.message, report.errorData.type ?? 'ClientError')
      : undefined;

    // Spread the (already redacted) report so any additional fields the
    // client happens to include — e.g. PII accidentally captured in form
    // state — are still logged, but only in their scrubbed form.
    const { id, ...restOfReport } = report;

    logger.error('Client error report', {
      context: {
        ...restOfReport,
        reportId: id,
      },
      error: clientError,
    });

 main
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return addHeaders(NextResponse.json({ ok: false }, { status: 400 }));
  }
}
