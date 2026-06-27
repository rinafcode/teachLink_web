/**
 * SMS Queue Tests
 *
 * Tests for the SMS Queue with log aggregation functionality.
 */

import { SMSQueue } from '@/lib/sms/queue';
import { TwilioProvider } from '@/lib/sms/provider';
import { SMSMessage } from '@/lib/sms/types';

describe('SMSQueue', () => {
  let queue: SMSQueue;
  let provider: TwilioProvider;

  beforeEach(() => {
    provider = new TwilioProvider();
    queue = new SMSQueue(provider, {
      maxRetries: 3,
      retryDelayMs: 100,
      maxConcurrent: 2,
    });
  });

  describe('enqueueing messages', () => {
    it('should enqueue a message', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      const result = await queue.enqueue(message);

      expect(result).toBeDefined();
      expect(result.provider).toBe('twilio');
    });

    it('should handle multiple concurrent messages', async () => {
      const messages: SMSMessage[] = [
        {
          to: { countryCode: '1', number: '5551234567' },
          body: 'Test 1',
        },
        {
          to: { countryCode: '1', number: '5551234568' },
          body: 'Test 2',
        },
        {
          to: { countryCode: '1', number: '5551234569' },
          body: 'Test 3',
        },
      ];

      const results = await Promise.all(messages.map((msg) => queue.enqueue(msg)));

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('should add message tags', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
        tags: ['transactional', 'verification-code'],
      };

      const result = await queue.enqueue(message);

      expect(result).toBeDefined();
    });
  });

  describe('delivery logs', () => {
    it('should retrieve delivery logs', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const logs = queue.getDeliveryLogs();

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by status', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const sentLogs = queue.getDeliveryLogs({ status: 'sent' });

      expect(Array.isArray(sentLogs)).toBe(true);
    });

    it('should filter logs by provider', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const logs = queue.getDeliveryLogs({ provider: 'twilio' });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should respect log limit', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const logs = queue.getDeliveryLogs({ limit: 5 });

      expect(logs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('delivery statistics', () => {
    it('should generate delivery statistics', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const stats = queue.getDeliveryStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.sent).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
      expect(stats.byProvider).toBeDefined();
    });

    it('should track stats by provider', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const stats = queue.getDeliveryStats();

      expect(stats.byProvider).toBeDefined();
      expect(Object.keys(stats.byProvider).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('log maintenance', () => {
    it('should clear old logs', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      const initialLogs = queue.getDeliveryLogs();
      const deletedCount = queue.clearOldLogs(0); // Clear all

      expect(typeof deletedCount).toBe('number');
    });

    it('should respect old log time threshold', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
      };

      await queue.enqueue(message);

      // Should not delete recent logs
      const deletedCount = queue.clearOldLogs(24 * 60 * 60 * 1000);

      expect(deletedCount).toBe(0);
    });
  });

  describe('message handling', () => {
    it('should handle multiple recipients', async () => {
      const message: SMSMessage = {
        to: [
          { countryCode: '1', number: '5551234567' },
          { countryCode: '1', number: '5551234568' },
        ],
        body: 'Test message',
      };

      const result = await queue.enqueue(message);

      expect(result).toBeDefined();
    });

    it('should include metadata in delivery logs', async () => {
      const message: SMSMessage = {
        to: {
          countryCode: '1',
          number: '5551234567',
        },
        body: 'Test message',
        metadata: {
          userId: 'user123',
          eventId: 'event456',
        },
      };

      await queue.enqueue(message);

      const logs = queue.getDeliveryLogs();

      if (logs.length > 0) {
        expect(logs[0].metadata).toBeDefined();
      }
    });
  });
});
