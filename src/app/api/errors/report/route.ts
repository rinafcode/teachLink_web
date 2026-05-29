import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';

const logger = createLogger('errors.report');

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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.warn('Failed to process error report', { error: err });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
