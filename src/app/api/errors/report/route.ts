import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';
import { withRateLimit } from '@/lib/ratelimit';

const logger = createLogger('errors.report');

class ClientError extends Error {
  constructor(message: string, name: string = 'ClientError') {
    super(message);
    this.name = name;
  }
}

function redactEmailFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactEmailFields);
  const redacted = { ...obj };
  for (const [key, value] of Object.entries(redacted)) {
    if (key.toLowerCase().includes('email')) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactEmailFields(value);
    }
  }
  return redacted;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit per IP — this endpoint is called by client-side JS and is
  // otherwise open to log-flooding DoS. Use the lower REPORTING tier (10/min).
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'REPORTING');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const report = redactEmailFields(await request.json());

    // Build a real Error so normalizeError captures name + message + stack properly
    const clientError = report.errorData?.message
      ? new ClientError(report.errorData.message, report.errorData.type ?? 'ClientError')
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

    return addHeaders(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return addHeaders(NextResponse.json({ ok: false }, { status: 400 }));
  }
}
