import { NextRequest } from 'next/server';
import { createCounterMetric, recordMetric } from '@/lib/logging/performance';
import { createLogger } from '@/lib/logging';

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

  return createLogger(scope, {
    ...context,
    requestId,
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
  const log = createLogger(scope, {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
  });
  const start = globalThis.performance?.now?.() ?? Date.now();

  log.info('Request started', { requestId });

  try {
    const result = await handler(requestId);
    const duration = Number(
      ((globalThis.performance?.now?.() ?? Date.now()) - start).toFixed(2),
    );
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
      context: { status },
      metrics: [metric, createCounterMetric('http.requests', 1, { status: status ?? 'unknown' })],
    });

    return result;
  } catch (error) {
    const duration = Number(
      ((globalThis.performance?.now?.() ?? Date.now()) - start).toFixed(2),
    );
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
      error,
      metrics: [metric, createCounterMetric('http.request.errors')],
    });
    throw error;
  }
}
