import pino from 'pino';
import type { AsyncLocalStorage as NodeAsyncLocalStorage } from 'node:async_hooks';
// Simple synchronous context storage compatible with both browser and Node.js
class SimpleAsyncLocalStorage<T> {
  private store: T | undefined;
  getStore(): T | undefined {
    return this.store;
  }
  run<R>(store: T, callback: () => R): R {
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = undefined;
    }
  }
}

let nodeAsyncLocalStorage: NodeAsyncLocalStorage<LogContextStore> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const asyncHooks = require('node:async_hooks') as typeof import('node:async_hooks');
  if (asyncHooks?.AsyncLocalStorage) {
    nodeAsyncLocalStorage = new asyncHooks.AsyncLocalStorage<LogContextStore>();
  }
} catch {
  nodeAsyncLocalStorage = null;
}

import { createCounterMetric } from './performance';
import { HttpLogTransport, InMemoryLogTransport, queryLogRecords } from './transports';
import { LogLevel, LogQuery, LogRecord, LogTransport, PerformanceMetric } from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'key',
  'authorization',
  'email',
  'phone',
  'ssn',
  'creditcard',
  'card',
  'cvv',
  'auth',
  'bearer',
  'credentials',
  'pwd',
];

export interface LogContextStore {
  requestId?: string;
  correlationId?: string;
}

export const logContextStorage:
  | NodeAsyncLocalStorage<LogContextStore>
  | SimpleAsyncLocalStorage<LogContextStore> =
  nodeAsyncLocalStorage ?? new SimpleAsyncLocalStorage<LogContextStore>();

export function runWithLogContext<T>(context: LogContextStore, callback: () => T): T {
  return logContextStorage.run(context, callback);
}

export function getLogContext(): LogContextStore | undefined {
  return logContextStorage.getStore();
}

export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function redactString(str: string): string {
  let result = str;
  // Redact bearer tokens in strings
  const bearerRegex = /bearer\s+[a-zA-Z0-9\-_\=\.]+/gi;
  result = result.replace(bearerRegex, 'Bearer [REDACTED]');
  return result;
}

export function redactObject(obj: unknown): any {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return redactString(obj);
    }
    return obj;
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: redactString(obj.message),
      stack: obj.stack ? redactString(obj.stack) : undefined,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey),
    );

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value);
    } else {
      redacted[key] = typeof value === 'string' ? redactString(value) : value;
    }
  }
  return redacted;
}

const configuredLevel =
  ((process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel) || 'info';

const pinoLogger = pino({
  level: configuredLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined,
  enabled: process.env.NODE_ENV !== 'test',
  redact: {
    paths: [
      'password',
      'secret',
      'token',
      'key',
      'authorization',
      'email',
      'phone',
      'ssn',
      '*.password',
      '*.secret',
      '*.token',
      '*.key',
      '*.authorization',
      '*.email',
      '*.phone',
      '*.ssn',
      'context.password',
      'context.secret',
      'context.token',
      'context.key',
      'context.authorization',
      'context.email',
      'context.phone',
      'context.ssn',
      'context.auth',
      'context.bearer',
      'context.credentials',
    ],
    censor: '[REDACTED]',
  },
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
      message: redactString(error.message),
      stack: error.stack ? redactString(error.stack) : undefined,
    };
  }

  return {
    message: redactString(String(error)),
  };
}

export interface LogPayload {
  requestId?: string;
  correlationId?: string;
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

    const contextStore = logContextStorage.getStore();
    const activeRequestId =
      payload.requestId ||
      contextStore?.requestId ||
      (this.baseContext.requestId as string) ||
      generateCorrelationId();
    const activeCorrelationId =
      payload.correlationId ||
      (payload.context?.correlationId as string) ||
      contextStore?.correlationId ||
      (this.baseContext.correlationId as string) ||
      activeRequestId;

    const baseRecord: LogRecord = {
      level,
      message,
      scope: this.scope,
      timestamp: new Date().toISOString(),
      requestId: activeRequestId,
      correlationId: activeCorrelationId,
      context: {
        ...this.baseContext,
        ...(payload.context ?? {}),
      },
      metrics: payload.metrics,
      error: normalizeError(payload.error),
    };

    const record = redactObject(baseRecord) as LogRecord;

    pinoLogger[level](
      {
        scope: record.scope,
        requestId: record.requestId,
        correlationId: record.correlationId,
        context: record.context,
        metrics: record.metrics,
        error: record.error,
      },
      record.message,
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
