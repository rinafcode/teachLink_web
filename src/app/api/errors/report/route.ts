import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';

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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
