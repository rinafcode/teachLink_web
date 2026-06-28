import {
  SMSMessage,
  SMSProvider,
  SMSSendResult,
  QueueJob,
  QueueOptions,
  SMSProviderType,
  SMSDeliveryLog,
} from './types';
import { createLogger } from '@/lib/logging';
import { createCounterMetric, measureAsync } from '@/lib/logging/performance';

const logger = createLogger('sms:queue');

const DEFAULT_OPTIONS: QueueOptions = {
  maxRetries: 3,
  retryDelayMs: 1500,
  maxConcurrent: 5,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createJobId(): string {
  return `sms_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// In-memory delivery log store for aggregation
const deliveryLogs: Map<string, SMSDeliveryLog> = new Map();

export class SMSQueue {
  private readonly provider: SMSProvider;
  private readonly options: QueueOptions;
  private readonly queue: QueueJob[] = [];
  private processing = 0;
  private requestId = '';

  constructor(provider: SMSProvider, options?: Partial<QueueOptions>) {
    this.provider = provider;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    logger.info('SMS Queue initialized', {
      context: {
        provider: this.provider.type,
        maxRetries: this.options.maxRetries,
        maxConcurrent: this.options.maxConcurrent,
        retryDelayMs: this.options.retryDelayMs,
      },
    });
  }

  enqueue(message: SMSMessage): Promise<SMSSendResult> {
    return new Promise((resolve) => {
      const jobId = createJobId();
      this.requestId = `${jobId}_parent`;

      const job: QueueJob = {
        id: jobId,
        message,
        attempts: 0,
        createdAt: Date.now(),
      };

      logger.info('SMS message enqueued', {
        requestId: this.requestId,
        context: {
          jobId,
          provider: this.provider.type,
          queueLength: this.queue.length + 1,
          tags: message.tags,
        },
      });

      this.queue.push(job);
      createCounterMetric('sms.enqueued', 1, {
        provider: this.provider.type,
      });

      this.process(resolve);
    });
  }

  private process(resolve: (result: SMSSendResult) => void): void {
    while (this.processing < this.options.maxConcurrent && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) {
        return;
      }

      this.processing += 1;
      void this.runJob(nextJob)
        .then((result) => resolve(result))
        .finally(() => {
          this.processing -= 1;
          this.process(resolve);
        });
    }
  }

  private async runJob(job: QueueJob): Promise<SMSSendResult> {
    let result: SMSSendResult = {
      success: false,
      provider: this.provider.type,
      error: 'No attempt made',
    };

    const phoneNumbers = Array.isArray(job.message.to) ? job.message.to : [job.message.to];

    while (job.attempts < this.options.maxRetries) {
      job.attempts += 1;

      logger.info('SMS send attempt', {
        requestId: this.requestId,
        context: {
          jobId: job.id,
          attempt: job.attempts,
          maxAttempts: this.options.maxRetries,
          provider: this.provider.type,
          recipientCount: phoneNumbers.length,
        },
      });

      // Measure send operation
      const { result: measuredResult } = await measureAsync(
        'sms.send_duration_ms',
        async () => {
          result = await this.provider.send(job.message);
          return result;
        },
        { provider: this.provider.type },
      );

      // Log delivery attempt
      for (const phoneNumber of phoneNumbers) {
        this.logDeliveryAttempt(job, phoneNumber, result, job.attempts);
      }

      if (result.success) {
        logger.info('SMS sent successfully', {
          requestId: this.requestId,
          context: {
            jobId: job.id,
            messageId: result.messageId,
            provider: this.provider.type,
            attempts: job.attempts,
          },
        });

        createCounterMetric('sms.sent', 1, {
          provider: this.provider.type,
        });

        return result;
      }

      if (job.attempts < this.options.maxRetries) {
        const backoffDelay = this.options.retryDelayMs * job.attempts;
        logger.warn('SMS send failed, retrying', {
          requestId: this.requestId,
          context: {
            jobId: job.id,
            attempt: job.attempts,
            nextRetryIn: backoffDelay,
            error: result.error,
          },
          error: new Error(result.error),
        });

        createCounterMetric('sms.retry', 1, {
          provider: this.provider.type,
          attempt: String(job.attempts),
        });

        await delay(backoffDelay);
      }
    }

    logger.error('SMS send failed after max retries', {
      requestId: this.requestId,
      context: {
        jobId: job.id,
        attempts: job.attempts,
        maxAttempts: this.options.maxRetries,
        provider: this.provider.type,
        lastError: result.error,
      },
      error: new Error(result.error),
    });

    createCounterMetric('sms.failed', 1, {
      provider: this.provider.type,
    });

    return {
      ...result,
      error: `Queue failed after ${job.attempts} attempts: ${result.error ?? 'Unknown error'}`,
    };
  }

  private logDeliveryAttempt(
    job: QueueJob,
    phoneNumber: any,
    result: SMSSendResult,
    attempt: number,
  ): void {
    const formattedNumber = `+${phoneNumber.countryCode}${phoneNumber.number}`;
    const logId = `${job.id}_${formattedNumber}`;

    const deliveryLog: SMSDeliveryLog = {
      jobId: job.id,
      provider: this.provider.type,
      phoneNumber: formattedNumber,
      messageBody: job.message.body.substring(0, 100), // Truncate for log
      messageId: result.messageId,
      status: result.success ? 'sent' : attempt < this.options.maxRetries ? 'retrying' : 'failed',
      attempts: attempt,
      maxRetries: this.options.maxRetries,
      error: result.error,
      tags: job.message.tags,
      metadata: job.message.metadata,
      createdAt: job.createdAt,
      updatedAt: Date.now(),
    };

    deliveryLogs.set(logId, deliveryLog);

    // Keep only recent logs (last 1000)
    if (deliveryLogs.size > 1000) {
      const oldestKey = Array.from(deliveryLogs.keys())[0];
      deliveryLogs.delete(oldestKey);
    }
  }

  // Get delivery logs for aggregation and monitoring
  getDeliveryLogs(filter?: {
    status?: 'pending' | 'sent' | 'failed' | 'retrying';
    provider?: SMSProviderType;
    limit?: number;
  }): SMSDeliveryLog[] {
    let logs = Array.from(deliveryLogs.values());

    if (filter?.status) {
      logs = logs.filter((log) => log.status === filter.status);
    }

    if (filter?.provider) {
      logs = logs.filter((log) => log.provider === filter.provider);
    }

    const limit = filter?.limit ?? 100;
    return logs.slice(-limit);
  }

  // Get delivery statistics
  getDeliveryStats(): {
    total: number;
    sent: number;
    failed: number;
    retrying: number;
    byProvider: Record<SMSProviderType, { total: number; sent: number; failed: number }>;
  } {
    const logs = Array.from(deliveryLogs.values());
    const stats = {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'sent').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      retrying: logs.filter((l) => l.status === 'retrying').length,
      byProvider: {} as Record<SMSProviderType, { total: number; sent: number; failed: number }>,
    };

    for (const log of logs) {
      if (!stats.byProvider[log.provider]) {
        stats.byProvider[log.provider] = { total: 0, sent: 0, failed: 0 };
      }
      stats.byProvider[log.provider].total++;
      if (log.status === 'sent') {
        stats.byProvider[log.provider].sent++;
      } else if (log.status === 'failed') {
        stats.byProvider[log.provider].failed++;
      }
    }

    return stats;
  }

  // Clear old logs (for maintenance)
  clearOldLogs(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - olderThanMs;
    let deletedCount = 0;

    for (const [key, log] of deliveryLogs.entries()) {
      if (log.updatedAt < cutoffTime) {
        deliveryLogs.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info('Cleared old SMS delivery logs', {
        context: {
          deletedCount,
          olderThanMs,
        },
      });
    }

    return deletedCount;
  }
}
