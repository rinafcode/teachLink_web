export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count';
  timestamp: number;
  tags?: Record<string, string | number | boolean>;
}

export interface LogRecord {
  level: LogLevel;
  message: string;
  scope: string;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  metrics?: PerformanceMetric[];
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

export interface LogQuery {
  level?: LogLevel | LogLevel[];
  scope?: string;
  requestId?: string;
  correlationId?: string;
  since?: number;
  search?: string;
  limit?: number;
}

export interface LogTransport {
  name: string;
  write(record: LogRecord): void | Promise<void>;
  query?(query: LogQuery): LogRecord[] | Promise<LogRecord[]>;
  flush?(): void | Promise<void>;
}
