/**
 * SMS Service Tests
 *
 * Tests for the SMS Service and multi-channel notification integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SMSService } from '@/lib/sms/service';

// Mock the provider so tests don't need real credentials
vi.mock('@/lib/sms/provider', () => ({
  createSMSProvider: () => ({
    type: 'twilio',
    send: vi.fn().mockResolvedValue({
      success: true,
      provider: 'twilio',
      messageId: 'mock_msg_123',
      timestamp: Date.now(),
    }),
  }),
}));

describe('SMSService', () => {
  let service: SMSService;

  beforeEach(() => {
    service = new SMSService();
  });

  describe('sendVerificationCode', () => {
    it('should send a verification code SMS', async () => {
      const result = await service.sendVerificationCode({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        name: 'Alice',
        code: '123456',
        expiresInMinutes: 10,
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('twilio');
    });
  });

  describe('sendSecurityAlert', () => {
    it('should send a security alert SMS', async () => {
      const result = await service.sendSecurityAlert({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        name: 'Alice',
        device: 'iPhone 15',
        timestamp: new Date().toISOString(),
        action: 'login',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('twilio');
    });
  });

  describe('sendCourseEnrollment', () => {
    it('should send a course enrollment SMS', async () => {
      const result = await service.sendCourseEnrollment({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        name: 'Alice',
        courseName: 'Advanced TypeScript',
        courseUrl: 'https://teachlink.app/courses/ts-advanced',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('twilio');
    });
  });

  describe('sendAccountWarning', () => {
    it('should send an account warning SMS', async () => {
      const result = await service.sendAccountWarning({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        name: 'Alice',
        reason: 'Suspicious login activity detected',
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe('twilio');
    });
  });

  describe('sendEvent', () => {
    it('should dispatch verification-code event', async () => {
      const result = await service.sendEvent({
        type: 'verification-code',
        data: {
          phoneNumber: { countryCode: '1', number: '5551234567' },
          code: '654321',
          expiresInMinutes: 5,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should dispatch security-alert event', async () => {
      const result = await service.sendEvent({
        type: 'security-alert',
        data: {
          phoneNumber: { countryCode: '1', number: '5551234567' },
          device: 'Chrome on macOS',
          timestamp: new Date().toISOString(),
          action: 'password-change',
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('delivery stats', () => {
    it('should return delivery stats', async () => {
      await service.sendVerificationCode({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        code: '000000',
        expiresInMinutes: 5,
      });

      const stats = service.getDeliveryStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.sent).toBe('number');
      expect(typeof stats.failed).toBe('number');
    });

    it('should return delivery logs', async () => {
      await service.sendVerificationCode({
        phoneNumber: { countryCode: '1', number: '5551234567' },
        code: '000000',
        expiresInMinutes: 5,
      });

      const logs = service.getDeliveryLogs();

      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
