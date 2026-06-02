import { NextRequest } from 'next/server';
import { createCounterMetric, recordMetric } from '@/lib/logging/performance';
import { createLogger, runWithLogContext } from '@/lib/logging';

function createRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getResponseStatus(result: unknown): number | undefined {
  if (typeof Response !== 'undefined' && result instanceof Response) {
    return result.status;
  }

  return undefined;
}

export function createRequestLogger(
  request: NextRequest,
  scope: string,
  context: Record<string, unknown> = {},
) {
  const requestId = request.headers.get('x-request-id') ?? createRequestId();
  const correlationId = request.headers.get('x-correlation-id') ?? requestId;

  return createLogger(scope, {
    ...context,
    requestId,
    correlationId,
    method: request.method,
    path: request.nextUrl.pathname,
  });
}

export async function withRequestLogging<T>(
  request: NextRequest,
  scope: string,
  handler: (requestId: string) => Promise<T>,
): Promise<T> {
  const requestId = request.headers.get('x-request-id') ?? createRequestId();
  const correlationId = request.headers.get('x-correlation-id') ?? requestId;
  const log = createLogger(scope, {
    requestId,
    correlationId,
    method: request.method,
    path: request.nextUrl.pathname,
  });
  const start = globalThis.performance?.now?.() ?? Date.now();

  log.info('Request started', { requestId, correlationId });

  try {
    const result = await runWithLogContext({ requestId, correlationId }, () => handler(requestId));
    const duration = Number(((globalThis.performance?.now?.() ?? Date.now()) - start).toFixed(2));
    const status = getResponseStatus(result);
    const metric = recordMetric({
      name: 'http.request.duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        method: request.method,
        path: request.nextUrl.pathname,
        status: status ?? 'unknown',
      },
    });

    log.info('Request completed', {
      requestId,
      correlationId,
      context: { status },
      metrics: [metric, createCounterMetric('http.requests', 1, { status: status ?? 'unknown' })],
    });

    return result;
  } catch (error) {
    const duration = Number(((globalThis.performance?.now?.() ?? Date.now()) - start).toFixed(2));
    const metric = recordMetric({
      name: 'http.request.failure_duration',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        method: request.method,
        path: request.nextUrl.pathname,
      },
    });

    log.error('Request failed', {
      requestId,
      correlationId,
      error,
      metrics: [metric, createCounterMetric('http.request.errors')],
    });
    throw error;
  }
}
