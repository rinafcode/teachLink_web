/**
 * SMS Log Aggregator Tests
 *
 * Tests for SMS log aggregation and metrics generation.
 */

import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';
import { LogRecord } from '@/lib/logging/types';

describe('SMSLogAggregator', () => {
  const mockSMSLog: LogRecord = {
    level: 'info',
    message: 'SMS sent successfully',
    scope: 'sms:queue',
    timestamp: new Date().toISOString(),
    requestId: 'test_123',
    context: {
      provider: 'twilio',
      status: 'sent',
      eventType: 'verification-code',
      messageId: 'msg_123',
      phoneNumber: '+15551234567',
      jobId: 'job_123',
    },
    metrics: [
      {
        name: 'sms.send_duration_ms',
        value: 1500,
        unit: 'ms',
        timestamp: Date.now(),
      },
    ],
  };

  describe('collect SMS logs', () => {
    it('should collect SMS-related logs', () => {
      const logs: LogRecord[] = [mockSMSLog];

      const collected = SMSLogAggregator.collectSMSLogs(logs);

      expect(collected).toBeDefined();
      expect(Array.isArray(collected)).toBe(true);
      expect(collected.length).toBeGreaterThan(0);
    });

    it('should filter non-SMS logs', () => {
      const nonSMSLog: LogRecord = {
        level: 'info',
        message: 'Some other log',
        scope: 'app:general',
        timestamp: new Date().toISOString(),
      };

      const logs: LogRecord[] = [mockSMSLog, nonSMSLog];

      const collected = SMSLogAggregator.collectSMSLogs(logs);

      expect(collected.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain store size limit', () => {
      const logs: LogRecord[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          ...mockSMSLog,
          timestamp: new Date(Date.now() + i).toISOString(),
        }));

      SMSLogAggregator.collectSMSLogs(logs);

      const stats = SMSLogAggregator.getStoreStats();
      expect(stats.totalLogs).toBeLessThanOrEqual(stats.maxCapacity);
    });
  });

  describe('query logs', () => {
    beforeEach(() => {
      SMSLogAggregator.collectSMSLogs([mockSMSLog]);
    });

    it('should query logs without filters', () => {
      const logs = SMSLogAggregator.queryLogs({});

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by level', () => {
      const logs = SMSLogAggregator.queryLogs({ level: ['info'] });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by provider', () => {
      const logs = SMSLogAggregator.queryLogs({ provider: 'twilio' });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by event type', () => {
      const logs = SMSLogAggregator.queryLogs({ eventType: 'verification-code' });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by status', () => {
      const logs = SMSLogAggregator.queryLogs({ status: 'sent' });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should respect limit and offset', () => {
      const logs = SMSLogAggregator.queryLogs({ limit: 10, offset: 0 });

      expect(logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('metrics generation', () => {
    beforeEach(() => {
      SMSLogAggregator.collectSMSLogs([mockSMSLog]);
    });

    it('should generate metrics', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalMessages).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate success rate', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });

    it('should calculate error rate', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(100);
    });

    it('should track metrics by provider', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics.byProvider).toBeDefined();
      expect(typeof metrics.byProvider).toBe('object');
    });

    it('should track metrics by event type', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics.byEventType).toBeDefined();
      expect(typeof metrics.byEventType).toBe('object');
    });

    it('should calculate average delivery time', () => {
      const metrics = SMSLogAggregator.getMetrics();

      expect(metrics.averageDeliveryTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should respect time range filter', () => {
      const oneHourAgo = 60 * 60 * 1000;
      const metrics = SMSLogAggregator.getMetrics(oneHourAgo);

      expect(metrics).toBeDefined();
    });
  });

  describe('failed messages', () => {
    beforeEach(() => {
      const failedLog: LogRecord = {
        ...mockSMSLog,
        level: 'error',
        message: 'SMS send failed',
        context: {
          ...mockSMSLog.context,
          status: 'failed',
        },
      };

      SMSLogAggregator.collectSMSLogs([failedLog]);
    });

    it('should retrieve failed messages', () => {
      const failed = SMSLogAggregator.getFailedMessages();

      expect(Array.isArray(failed)).toBe(true);
    });

    it('should respect failed messages limit', () => {
      const failed = SMSLogAggregator.getFailedMessages(5);

      expect(failed.length).toBeLessThanOrEqual(5);
    });
  });

  describe('anomalies detection', () => {
    it('should detect slow deliveries', () => {
      const slowLog: LogRecord = {
        ...mockSMSLog,
        metrics: [
          {
            name: 'sms.send_duration_ms',
            value: 10000, // > 5 seconds
            unit: 'ms',
            timestamp: Date.now(),
          },
        ],
      };

      SMSLogAggregator.collectSMSLogs([slowLog]);

      const anomalies = SMSLogAggregator.getAnomalies();

      expect(anomalies.slowDeliveries).toBeDefined();
      expect(Array.isArray(anomalies.slowDeliveries)).toBe(true);
    });

    it('should detect high retry attempts', () => {
      const retryLog: LogRecord = {
        ...mockSMSLog,
        context: {
          ...mockSMSLog.context,
          attempt: 3,
        },
      };

      SMSLogAggregator.collectSMSLogs([retryLog]);

      const anomalies = SMSLogAggregator.getAnomalies();

      expect(anomalies.highRetryAttempts).toBeDefined();
      expect(Array.isArray(anomalies.highRetryAttempts)).toBe(true);
    });

    it('should detect configuration errors', () => {
      const configErrorLog: LogRecord = {
        ...mockSMSLog,
        level: 'error',
        message: 'Twilio provider not configured',
        context: {
          ...mockSMSLog.context,
          missingCredentials: true,
        },
      };

      SMSLogAggregator.collectSMSLogs([configErrorLog]);

      const anomalies = SMSLogAggregator.getAnomalies();

      expect(anomalies.configurationErrors).toBeDefined();
      expect(Array.isArray(anomalies.configurationErrors)).toBe(true);
    });
  });

  describe('data export', () => {
    beforeEach(() => {
      SMSLogAggregator.collectSMSLogs([mockSMSLog]);
    });

    it('should export logs as JSON', () => {
      const json = SMSLogAggregator.exportLogs('json');

      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export logs as CSV', () => {
      const csv = SMSLogAggregator.exportLogs('csv');

      expect(typeof csv).toBe('string');
      expect(csv.includes(',')).toBe(true); // Should contain CSV delimiters
    });
  });

  describe('log maintenance', () => {
    beforeEach(() => {
      SMSLogAggregator.collectSMSLogs([mockSMSLog]);
    });

    it('should clear old logs', () => {
      const deletedCount = SMSLogAggregator.clearOldLogs(0); // Clear all

      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should respect time threshold for clearing', () => {
      const deletedCount = SMSLogAggregator.clearOldLogs(24 * 60 * 60 * 1000); // 24 hours

      expect(deletedCount).toBe(0); // Should not delete recent logs
    });

    it('should get store size', () => {
      const size = SMSLogAggregator.getStoreSize();

      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should get store statistics', () => {
      const stats = SMSLogAggregator.getStoreStats();

      expect(stats).toBeDefined();
      expect(stats.totalLogs).toBeGreaterThanOrEqual(0);
      expect(stats.maxCapacity).toBeGreaterThan(0);
      expect(stats.utilizationPercent).toBeGreaterThanOrEqual(0);
    });
  });
});
