/**
 * SMS Log Aggregator
 *
 * This module provides comprehensive log aggregation for SMS integration,
 * collecting delivery metrics, errors, and performance data for monitoring
 * and analytics purposes.
 */

import { LogRecord, LogQuery } from './types';
import { createLogger } from './index';

const logger = createLogger('logging:sms-aggregator');

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

// In-memory store for SMS-specific logs
const smsLogStore: AggregatedSMSLog[] = [];
const MAX_SMS_LOGS = 5000;

export class SMSLogAggregator {
  /**
   * Collect SMS-related logs from the general log stream
   */
  static collectSMSLogs(records: LogRecord[]): AggregatedSMSLog[] {
    const smsLogs = records
      .filter((record) => record.scope.includes('sms') || record.context?.provider)
      .map((record) => this.transformToAggregatedLog(record));

    // Store in local aggregator
    smsLogs.forEach((log) => this.addToStore(log));

    logger.info('SMS logs collected', {
      context: {
        collectedCount: smsLogs.length,
        storeSize: smsLogStore.length,
      },
    });

    return smsLogs;
  }

  /**
   * Query aggregated SMS logs with filtering and aggregation
   */
  static queryLogs(query: {
    level?: string[];
    provider?: string;
    eventType?: string;
    status?: string;
    since?: number;
    limit?: number;
    offset?: number;
  }): AggregatedSMSLog[] {
    let filtered = [...smsLogStore];

    if (query.level && query.level.length > 0) {
      filtered = filtered.filter((log) => query.level!.includes(log.level));
    }

    if (query.provider) {
      filtered = filtered.filter((log) => log.context.provider === query.provider);
    }

    if (query.eventType) {
      filtered = filtered.filter((log) => log.context.eventType === query.eventType);
    }

    if (query.status) {
      filtered = filtered.filter((log) => log.context.status === query.status);
    }

    if (query.since) {
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= query.since!);
    }

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 100;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Generate comprehensive SMS delivery metrics
   */
  static getMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000): SMSLogMetrics {
    const cutoffTime = Date.now() - timeRangeMs;
    const recentLogs = smsLogStore.filter((log) => new Date(log.timestamp).getTime() >= cutoffTime);

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
   */
  static getFailedMessages(limit: number = 100) {
    const failed = smsLogStore.filter((log) => log.context.status === 'failed').slice(-limit);

    logger.info('Failed messages retrieved', {
      context: {
        count: failed.length,
      },
    });

    return failed;
  }

  /**
   * Get performance anomalies (slow deliveries, high retry rates)
   */
  static getAnomalies(): {
    slowDeliveries: AggregatedSMSLog[];
    highRetryAttempts: AggregatedSMSLog[];
    configurationErrors: AggregatedSMSLog[];
  } {
    const anomalies = {
      slowDeliveries: smsLogStore.filter((log) => {
        const delivery = log.metrics?.find((m) => m.name === 'sms.send_duration_ms');
        return delivery && delivery.value > 5000; // > 5 seconds
      }),
      highRetryAttempts: smsLogStore.filter((log) => {
        return log.context.attempt && log.context.attempt >= 2;
      }),
      configurationErrors: smsLogStore.filter((log) => {
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
   */
  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(smsLogStore, null, 2);
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

    const rows = smsLogStore.map((log) => [
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
   * Clear old logs to manage storage
   */
  static clearOldLogs(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - olderThanMs;
    const initialSize = smsLogStore.length;

    const index = smsLogStore.findIndex((log) => new Date(log.timestamp).getTime() >= cutoffTime);

    if (index > 0) {
      smsLogStore.splice(0, index);
    }

    const deletedCount = initialSize - smsLogStore.length;

    if (deletedCount > 0) {
      logger.info('Old SMS logs cleared', {
        context: {
          deletedCount,
          olderThanMs,
          remainingLogs: smsLogStore.length,
        },
      });
    }

    return deletedCount;
  }

  /**
   * Transform a LogRecord into an AggregatedSMSLog
   */
  private static transformToAggregatedLog(record: LogRecord): AggregatedSMSLog {
    return {
      id: `${record.scope}_${record.timestamp}`,
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

  /**
   * Add log to store, maintaining size limit
   */
  private static addToStore(log: AggregatedSMSLog): void {
    smsLogStore.push(log);

    if (smsLogStore.length > MAX_SMS_LOGS) {
      smsLogStore.splice(0, smsLogStore.length - MAX_SMS_LOGS);
    }
  }

  /**
   * Get store size for monitoring
   */
  static getStoreSize(): number {
    return smsLogStore.length;
  }

  /**
   * Get store stats
   */
  static getStoreStats() {
    return {
      totalLogs: smsLogStore.length,
      maxCapacity: MAX_SMS_LOGS,
      utilizationPercent: (smsLogStore.length / MAX_SMS_LOGS) * 100,
      oldestLog: smsLogStore.length > 0 ? smsLogStore[0].timestamp : null,
      newestLog: smsLogStore.length > 0 ? smsLogStore[smsLogStore.length - 1].timestamp : null,
    };
  }
}
