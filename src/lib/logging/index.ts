import pino from 'pino';
import { createCounterMetric } from './performance';
import { HttpLogTransport, InMemoryLogTransport, queryLogRecords } from './transports';
import { LogLevel, LogQuery, LogRecord, LogTransport, PerformanceMetric } from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel =
  ((process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel) || 'info';

const pinoLogger = pino({
  level: configuredLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined,
  enabled: process.env.NODE_ENV !== 'test',
});

const transports: LogTransport[] = [new InMemoryLogTransport()];
const aggregationEndpoint =
  process.env.LOG_AGGREGATION_URL || process.env.NEXT_PUBLIC_LOG_AGGREGATION_URL;

if (aggregationEndpoint) {
  transports.push(new HttpLogTransport(aggregationEndpoint));
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

function normalizeError(error: unknown): LogRecord['error'] | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export interface LogPayload {
  requestId?: string;
  context?: Record<string, unknown>;
  metrics?: PerformanceMetric[];
  error?: unknown;
}

export interface AppLogger {
  debug(message: string, payload?: LogPayload): void;
  info(message: string, payload?: LogPayload): void;
  warn(message: string, payload?: LogPayload): void;
  error(message: string, payload?: LogPayload): void;
  child(scope: string, context?: Record<string, unknown>): AppLogger;
}

class Logger implements AppLogger {
  constructor(
    private readonly scope: string,
    private readonly baseContext: Record<string, unknown> = {},
  ) {}

  debug(message: string, payload: LogPayload = {}): void {
    this.write('debug', message, payload);
  }

  info(message: string, payload: LogPayload = {}): void {
    this.write('info', message, payload);
  }

  warn(message: string, payload: LogPayload = {}): void {
    this.write('warn', message, payload);
  }

  error(message: string, payload: LogPayload = {}): void {
    this.write('error', message, payload);
  }

  child(scope: string, context: Record<string, unknown> = {}): AppLogger {
    return new Logger(scope, { ...this.baseContext, ...context });
  }

  private write(level: LogLevel, message: string, payload: LogPayload): void {
    if (!shouldLog(level)) {
      return;
    }

    const record: LogRecord = {
      level,
      message,
      scope: this.scope,
      timestamp: new Date().toISOString(),
      requestId: payload.requestId,
      context: {
        ...this.baseContext,
        ...(payload.context ?? {}),
      },
      metrics: payload.metrics,
      error: normalizeError(payload.error),
    };

    pinoLogger[level](
      {
        scope: record.scope,
        requestId: record.requestId,
        context: record.context,
        metrics: record.metrics,
        error: record.error,
      },
      message,
    );

    for (const transport of transports) {
      void Promise.resolve(transport.write(record));
    }

    createCounterMetric('logs.total', 1, {
      level,
      scope: this.scope,
    });
  }
}

export function createLogger(scope: string, context: Record<string, unknown> = {}): AppLogger {
  return new Logger(scope, context);
}

export function queryLogs(query: LogQuery): LogRecord[] {
  return queryLogRecords(query);
}

export const logger = createLogger('app');
