/**
 * SMS Log Aggregator
 *
 * This module provides comprehensive log aggregation for SMS integration,
 * collecting delivery metrics, errors, and performance data for monitoring
 * and analytics purposes.
 *
 * Architecture:
 * - Small in-memory buffer (100 entries) for fast recent queries
 * - Persistent database storage for historical data
 * - Automatic flushing on interval or buffer capacity
 */

import { LogRecord, LogQuery } from './types';
import { createLogger } from './index';
import { query } from '@/lib/db';

const logger = createLogger('logging:sms-aggregator');

// Configuration
const IN_MEMORY_BUFFER_SIZE = parseInt(process.env.SMS_LOG_BUFFER_SIZE || '100', 10);
const FLUSH_INTERVAL_MS = parseInt(process.env.SMS_LOG_FLUSH_INTERVAL_MS || '30000', 10); // 30 seconds
const FLUSH_THRESHOLD = Math.floor(IN_MEMORY_BUFFER_SIZE * 0.8); // Flush at 80% capacity

export interface SMSLogMetrics {
  totalMessages: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  retriedDeliveries: number;
  averageDeliveryTimeMs: number;
  errorRate: number;
  successRate: number;
  byProvider: Record<string, ProviderMetrics>;
  byEventType: Record<string, EventTypeMetrics>;
  timeRange: {
    from: string;
    to: string;
  };
}

export interface ProviderMetrics {
  name: string;
  total: number;
  successful: number;
  failed: number;
  avgDeliveryTimeMs: number;
  errorRate: number;
}

export interface EventTypeMetrics {
  type: string;
  total: number;
  successful: number;
  failed: number;
  avgDeliveryTimeMs: number;
}

export interface AggregatedSMSLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  scope: string;
  requestId?: string;
  context: {
    jobId?: string;
    provider?: string;
    phoneNumber?: string;
    messageId?: string;
    attempt?: number;
    status?: string;
    eventType?: string;
    recipientCount?: number;
    queueLength?: number;
    [key: string]: unknown;
  };
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  metrics?: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
}

// In-memory buffer for recent SMS logs (fast access)
const smsLogBuffer: AggregatedSMSLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;

export class SMSLogAggregator {
  /**
   * Initialize the aggregator and start the flush timer
   */
  static initialize(): void {
    if (!flushTimer) {
      flushTimer = setInterval(() => {
        this.flushToDatabase().catch((err) => {
          logger.error('Failed to flush SMS logs to database', { error: err });
        });
      }, FLUSH_INTERVAL_MS);

      // Ensure flush on process exit
      process.on('beforeExit', () => {
        this.shutdown().catch(console.error);
      });

      logger.info('SMS log aggregator initialized', {
        context: {
          bufferSize: IN_MEMORY_BUFFER_SIZE,
          flushIntervalMs: FLUSH_INTERVAL_MS,
          flushThreshold: FLUSH_THRESHOLD,
        },
      });
    }
  }

  /**
   * Shutdown the aggregator and flush remaining logs
   */
  static async shutdown(): Promise<void> {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    await this.flushToDatabase();
    logger.info('SMS log aggregator shutdown complete');
  }

  /**
   * Collect SMS-related logs from the general log stream
   */
  static collectSMSLogs(records: LogRecord[]): AggregatedSMSLog[] {
    const smsLogs = records
      .filter((record) => record.scope.includes('sms') || record.context?.provider)
      .map((record) => this.transformToAggregatedLog(record));

    // Store in buffer
    smsLogs.forEach((log) => this.addToBuffer(log));

    logger.info('SMS logs collected', {
      context: {
        collectedCount: smsLogs.length,
        bufferSize: smsLogBuffer.length,
      },
    });

    return smsLogs;
  }

  /**
   * Flush in-memory buffer to database
   */
  private static async flushToDatabase(): Promise<number> {
    if (smsLogBuffer.length === 0) {
      return 0;
    }

    const logsToFlush = [...smsLogBuffer];
    smsLogBuffer.length = 0; // Clear buffer

    try {
      await this.bulkInsertLogs(logsToFlush);
      
      logger.info('SMS logs flushed to database', {
        context: {
          flushedCount: logsToFlush.length,
        },
      });

      return logsToFlush.length;
    } catch (err) {
      // On failure, restore logs to buffer (up to capacity)
      const restoredCount = Math.min(logsToFlush.length, IN_MEMORY_BUFFER_SIZE);
      smsLogBuffer.unshift(...logsToFlush.slice(0, restoredCount));
      
      logger.error('Failed to flush SMS logs, restored to buffer', {
        error: err,
        context: {
          attemptedCount: logsToFlush.length,
          restoredCount,
        },
      });

      throw err;
    }
  }

  /**
   * Bulk insert logs into database
   */
  private static async bulkInsertLogs(logs: AggregatedSMSLog[]): Promise<void> {
    if (logs.length === 0) return;

    const values: unknown[] = [];
    const valuePlaceholders: string[] = [];

    logs.forEach((log, index) => {
      const offset = index * 16;
      valuePlaceholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`
      );

      values.push(
        log.id,
        log.timestamp,
        log.level,
        log.message,
        log.scope,
        log.requestId || null,
        log.context.jobId || null,
        log.context.provider || null,
        log.context.phoneNumber || null,
        log.context.messageId || null,
        log.context.attempt || 1,
        log.context.status || null,
        log.context.eventType || null,
        log.context.recipientCount || null,
        log.context.queueLength || null,
        JSON.stringify(log.context)
      );
    });

    const sql = `
      INSERT INTO sms_logs (
        id, timestamp, level, message, scope, request_id,
        job_id, provider, phone_number, message_id, attempt, status,
        event_type, recipient_count, queue_length, context
      ) VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;

    await query(sql, values);
  }

  /**
   * Query aggregated SMS logs with filtering and aggregation
   * Falls back to database for historical data beyond in-memory buffer
   */
  static async queryLogs(query: {
    level?: string[];
    provider?: string;
    eventType?: string;
    status?: string;
    since?: number;
    limit?: number;
    offset?: number;
  }): Promise<AggregatedSMSLog[]> {
    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    // First, try to satisfy from in-memory buffer
    let bufferResults = this.queryBuffer(query);

    // If we need more results or offset exceeds buffer, query database
    if (bufferResults.length < limit || offset >= smsLogBuffer.length) {
      const dbResults = await this.queryDatabase(query);
      
      // Merge and deduplicate results (buffer is more recent)
      const bufferIds = new Set(bufferResults.map((log) => log.id));
      const uniqueDbResults = dbResults.filter((log) => !bufferIds.has(log.id));
      
      bufferResults = [...bufferResults, ...uniqueDbResults];
    }

    return bufferResults.slice(offset, offset + limit);
  }

  /**
   * Query in-memory buffer
   */
  private static queryBuffer(queryParams: {
    level?: string[];
    provider?: string;
    eventType?: string;
    status?: string;
    since?: number;
  }): AggregatedSMSLog[] {
    let filtered = [...smsLogBuffer];

    if (queryParams.level && queryParams.level.length > 0) {
      filtered = filtered.filter((log) => queryParams.level!.includes(log.level));
    }

    if (queryParams.provider) {
      filtered = filtered.filter((log) => log.context.provider === queryParams.provider);
    }

    if (queryParams.eventType) {
      filtered = filtered.filter((log) => log.context.eventType === queryParams.eventType);
    }

    if (queryParams.status) {
      filtered = filtered.filter((log) => log.context.status === queryParams.status);
    }

    if (queryParams.since) {
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= queryParams.since!);
    }

    return filtered;
  }

  /**
   * Query database for historical logs
   */
  private static async queryDatabase(queryParams: {
    level?: string[];
    provider?: string;
    eventType?: string;
    status?: string;
    since?: number;
    limit?: number;
    offset?: number;
  }): Promise<AggregatedSMSLog[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (queryParams.level && queryParams.level.length > 0) {
      conditions.push(`level = ANY($${paramIndex})`);
      values.push(queryParams.level);
      paramIndex++;
    }

    if (queryParams.provider) {
      conditions.push(`provider = $${paramIndex}`);
      values.push(queryParams.provider);
      paramIndex++;
    }

    if (queryParams.eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      values.push(queryParams.eventType);
      paramIndex++;
    }

    if (queryParams.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(queryParams.status);
      paramIndex++;
    }

    if (queryParams.since) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(new Date(queryParams.since).toISOString());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = queryParams.limit ?? 100;
    const offset = queryParams.offset ?? 0;

    const sql = `
      SELECT 
        id, timestamp, level, message, scope, request_id as "requestId",
        job_id, provider, phone_number, message_id, attempt, status,
        event_type, recipient_count, queue_length, context, error, metrics
      FROM sms_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    try {
      const result = await query(sql, values);
      
      return result.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        level: row.level,
        message: row.message,
        scope: row.scope,
        requestId: row.requestId,
        context: {
          jobId: row.job_id,
          provider: row.provider,
          phoneNumber: row.phone_number,
          messageId: row.message_id,
          attempt: row.attempt,
          status: row.status,
          eventType: row.event_type,
          recipientCount: row.recipient_count,
          queueLength: row.queue_length,
          ...row.context,
        },
        error: row.error,
        metrics: row.metrics,
      }));
    } catch (err) {
      logger.error('Failed to query SMS logs from database', { error: err });
      return [];
    }
  }

  /**
   * Generate comprehensive SMS delivery metrics
   * Combines in-memory buffer and database queries
   */
  static async getMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000): Promise<SMSLogMetrics> {
    const cutoffTime = Date.now() - timeRangeMs;
    
    // Get logs from buffer
    const bufferLogs = smsLogBuffer.filter(
      (log) => new Date(log.timestamp).getTime() >= cutoffTime
    );

    // Get additional logs from database
    const dbLogs = await this.queryDatabase({
      since: cutoffTime,
      limit: 10000, // reasonable limit for metrics calculation
    });

    // Merge and deduplicate
    const bufferIds = new Set(bufferLogs.map((log) => log.id));
    const uniqueDbLogs = dbLogs.filter((log) => !bufferIds.has(log.id));
    const recentLogs = [...bufferLogs, ...uniqueDbLogs];

    const metrics: SMSLogMetrics = {
      totalMessages: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      retriedDeliveries: 0,
      averageDeliveryTimeMs: 0,
      errorRate: 0,
      successRate: 0,
      byProvider: {},
      byEventType: {},
      timeRange: {
        from: new Date(cutoffTime).toISOString(),
        to: new Date().toISOString(),
      },
    };

    const deliveryTimes: number[] = [];
    const providers = new Set<string>();
    const eventTypes = new Set<string>();

    // Aggregate data
    for (const log of recentLogs) {
      if (log.context.status === 'sent') {
        metrics.successfulDeliveries++;
      } else if (log.context.status === 'failed') {
        metrics.failedDeliveries++;
      } else if (log.context.status === 'retrying') {
        metrics.retriedDeliveries++;
      }

      if (log.context.provider) {
        providers.add(log.context.provider);
      }

      if (log.context.eventType) {
        eventTypes.add(log.context.eventType);
      }

      // Collect delivery times from metrics
      if (log.metrics) {
        log.metrics.forEach((metric) => {
          if (metric.name === 'sms.send_duration_ms') {
            deliveryTimes.push(metric.value);
          }
        });
      }
    }

    metrics.totalMessages = recentLogs.length;
    metrics.averageDeliveryTimeMs =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

    if (metrics.totalMessages > 0) {
      metrics.successRate = (metrics.successfulDeliveries / metrics.totalMessages) * 100;
      metrics.errorRate = 100 - metrics.successRate;
    }

    // Provider metrics
    for (const provider of providers) {
      const providerLogs = recentLogs.filter((log) => log.context.provider === provider);
      const successful = providerLogs.filter((log) => log.context.status === 'sent').length;
      const failed = providerLogs.filter((log) => log.context.status === 'failed').length;

      const providerDeliveryTimes = providerLogs
        .filter((log) => log.metrics)
        .flatMap((log) =>
          log.metrics!.filter((m) => m.name === 'sms.send_duration_ms').map((m) => m.value),
        );

      metrics.byProvider[provider] = {
        name: provider,
        total: providerLogs.length,
        successful,
        failed,
        avgDeliveryTimeMs:
          providerDeliveryTimes.length > 0
            ? providerDeliveryTimes.reduce((a, b) => a + b, 0) / providerDeliveryTimes.length
            : 0,
        errorRate: providerLogs.length > 0 ? (failed / providerLogs.length) * 100 : 0,
      };
    }

    // Event type metrics
    for (const eventType of eventTypes) {
      const eventLogs = recentLogs.filter((log) => log.context.eventType === eventType);
      const successful = eventLogs.filter((log) => log.context.status === 'sent').length;
      const failed = eventLogs.filter((log) => log.context.status === 'failed').length;

      const eventDeliveryTimes = eventLogs
        .filter((log) => log.metrics)
        .flatMap((log) =>
          log.metrics!.filter((m) => m.name === 'sms.send_duration_ms').map((m) => m.value),
        );

      metrics.byEventType[eventType] = {
        type: eventType,
        total: eventLogs.length,
        successful,
        failed,
        avgDeliveryTimeMs:
          eventDeliveryTimes.length > 0
            ? eventDeliveryTimes.reduce((a, b) => a + b, 0) / eventDeliveryTimes.length
            : 0,
      };
    }

    logger.info('SMS metrics generated', {
      context: {
        totalMessages: metrics.totalMessages,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        avgDeliveryTimeMs: metrics.averageDeliveryTimeMs,
      },
    });

    return metrics;
  }

  /**
   * Get failed message logs for investigation and recovery
   * Queries both buffer and database
   */
  static async getFailedMessages(limit: number = 100): Promise<AggregatedSMSLog[]> {
    const failed = await this.queryLogs({ status: 'failed', limit });

    logger.info('Failed messages retrieved', {
      context: {
        count: failed.length,
      },
    });

    return failed;
  }

  /**
   * Get performance anomalies (slow deliveries, high retry rates)
   * Searches both buffer and recent database records
   */
  static async getAnomalies(): Promise<{
    slowDeliveries: AggregatedSMSLog[];
    highRetryAttempts: AggregatedSMSLog[];
    configurationErrors: AggregatedSMSLog[];
  }> {
    // Get recent logs (last hour) from both buffer and database
    const recentLogs = await this.queryLogs({
      since: Date.now() - 60 * 60 * 1000,
      limit: 1000,
    });

    const anomalies = {
      slowDeliveries: recentLogs.filter((log) => {
        const delivery = log.metrics?.find((m) => m.name === 'sms.send_duration_ms');
        return delivery && delivery.value > 5000; // > 5 seconds
      }),
      highRetryAttempts: recentLogs.filter((log) => {
        return log.context.attempt && log.context.attempt >= 2;
      }),
      configurationErrors: recentLogs.filter((log) => {
        return log.context.missingCredentials || log.error?.message.includes('not configured');
      }),
    };

    if (anomalies.slowDeliveries.length > 0) {
      logger.warn('Slow SMS deliveries detected', {
        context: {
          count: anomalies.slowDeliveries.length,
        },
      });
    }

    if (anomalies.configurationErrors.length > 0) {
      logger.error('SMS configuration errors detected', {
        context: {
          count: anomalies.configurationErrors.length,
        },
      });
    }

    return anomalies;
  }

  /**
   * Export logs for external aggregation service
   * Exports from both buffer and database
   */
  static async exportLogs(
    format: 'json' | 'csv' = 'json',
    options?: { since?: number; limit?: number }
  ): Promise<string> {
    const logs = await this.queryLogs({
      since: options?.since,
      limit: options?.limit ?? 10000,
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'timestamp',
      'level',
      'message',
      'provider',
      'status',
      'eventType',
      'phoneNumber',
      'messageId',
      'error',
    ];

    const rows = logs.map((log) => [
      log.timestamp,
      log.level,
      log.message,
      log.context.provider || '',
      log.context.status || '',
      log.context.eventType || '',
      log.context.phoneNumber || '',
      log.context.messageId || '',
      log.error?.message || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Clear old logs from database to manage storage
   */
  static async clearOldLogs(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanMs).toISOString();

    try {
      const result = await query('DELETE FROM sms_logs WHERE timestamp < $1', [cutoffTime]);
      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info('Old SMS logs cleared from database', {
          context: {
            deletedCount,
            olderThanMs,
          },
        });
      }

      return deletedCount;
    } catch (err) {
      logger.error('Failed to clear old SMS logs', { error: err });
      return 0;
    }
  }

  /**
   * Transform a LogRecord into an AggregatedSMSLog
   */
  private static transformToAggregatedLog(record: LogRecord): AggregatedSMSLog {
    return {
      id: `${record.scope}_${record.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: record.timestamp,
      level: record.level,
      message: record.message,
      scope: record.scope,
      requestId: record.requestId,
      context: (record.context || {}) as any,
      error: record.error,
      metrics: record.metrics,
    };
  }

  private static stats = {
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
  };

  /**
   * Add log to buffer, maintaining size limit and triggering flush if needed
   */
  private static addToBuffer(log: AggregatedSMSLog): void {
    smsLogBuffer.push(log);

    // Update stats incrementally
    this.stats.totalMessages++;
    if (log.context.status === 'sent') {
      this.stats.successfulMessages++;
    } else if (log.context.status === 'failed') {
      this.stats.failedMessages++;
    }

    // Maintain buffer size limit
    if (smsLogBuffer.length > IN_MEMORY_BUFFER_SIZE) {
      smsLogBuffer.splice(0, smsLogBuffer.length - IN_MEMORY_BUFFER_SIZE);
    }

    // Trigger flush if threshold reached
    if (smsLogBuffer.length >= FLUSH_THRESHOLD) {
      this.flushToDatabase().catch((err) => {
        logger.error('Auto-flush failed', { error: err });
      });
    }
  }

  /**
   * Get buffer size for monitoring
   */
  static getBufferSize(): number {
    return smsLogBuffer.length;
  }

  /**
   * Get aggregator stats
   */
  static getStoreStats() {
    return {
      bufferSize: smsLogBuffer.length,
      bufferCapacity: IN_MEMORY_BUFFER_SIZE,
      utilizationPercent: (smsLogBuffer.length / IN_MEMORY_BUFFER_SIZE) * 100,
      oldestBufferLog: smsLogBuffer.length > 0 ? smsLogBuffer[0].timestamp : null,
      newestBufferLog:
        smsLogBuffer.length > 0 ? smsLogBuffer[smsLogBuffer.length - 1].timestamp : null,
      totalMessages: this.stats.totalMessages,
      failedCount: this.stats.failedMessages,
      successRate:
        this.stats.totalMessages > 0
          ? (this.stats.successfulMessages / this.stats.totalMessages) * 100
          : 0,
      flushIntervalMs: FLUSH_INTERVAL_MS,
      flushThreshold: FLUSH_THRESHOLD,
    };
  }
}
