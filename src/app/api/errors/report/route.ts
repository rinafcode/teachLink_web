import { NextRequest, NextResponse } from 'next/server';
import { createLogger, redactObject } from '@/lib/logging';
import { withRateLimit } from '@/lib/ratelimit';

const logger = createLogger('errors.report');

class ClientError extends Error {
  constructor(message: string, name: string = 'ClientError') {
    super(message);
    this.name = name;
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

    return addHeaders(NextResponse.json({ ok: true }, { status: 200 }));
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return addHeaders(NextResponse.json({ ok: false }, { status: 400 }));
  }
}
