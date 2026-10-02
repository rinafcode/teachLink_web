import { describe, it, expect, vi } from 'vitest';
import {
  FRAUD_SEVERITIES,
  FRAUD_CATEGORIES,
  isFraudSeverity,
  isFraudCategory,
  isValidFraudEvent,
  isValidFraudDetectionResult,
  isValidUserActionContext,
  isValidConferenceAccessCheck,
  isValidFraudDetectionConfig,
  type FraudEvent,
  type FraudDetectionResult,
  type UserActionContext,
  type ConferenceAccessCheck,
  type FraudDetectionConfig,
} from '../types';

describe('fraud-detection/types module', () => {
  describe('Constants and enumerations', () => {
    it('defines all valid fraud severities', () => {
      expect(FRAUD_SEVERITIES).toContain('low');
      expect(FRAUD_SEVERITIES).toContain('medium');
      expect(FRAUD_SEVERITIES).toContain('high');
      expect(FRAUD_SEVERITIES).toContain('critical');
      expect(FRAUD_SEVERITIES).toHaveLength(4);
    });

    it('defines all valid fraud categories', () => {
      expect(FRAUD_CATEGORIES).toContain('RAPID_JOIN_LEAVE');
      expect(FRAUD_CATEGORIES).toContain('MULTIPLE_CONNECTIONS');
      expect(FRAUD_CATEGORIES).toContain('SCREEN_SHARE_ABUSE');
      expect(FRAUD_CATEGORIES).toContain('UNAUTHORIZED_ACCESS');
      expect(FRAUD_CATEGORIES).toContain('ACTION_ABUSE');
      expect(FRAUD_CATEGORIES).toContain('SUSPICIOUS_IDENTITY');
      expect(FRAUD_CATEGORIES).toContain('MEETING_BOMBING');
      expect(FRAUD_CATEGORIES).toHaveLength(7);
    });
  });

  describe('isFraudSeverity', () => {
    it('returns true for all valid severities', () => {
      expect(isFraudSeverity('low')).toBe(true);
      expect(isFraudSeverity('medium')).toBe(true);
      expect(isFraudSeverity('high')).toBe(true);
      expect(isFraudSeverity('critical')).toBe(true);
    });

    it('returns false for invalid inputs and edge cases', () => {
      expect(isFraudSeverity('CRITICAL')).toBe(false);
      expect(isFraudSeverity('unknown')).toBe(false);
      expect(isFraudSeverity('')).toBe(false);
      expect(isFraudSeverity(null)).toBe(false);
      expect(isFraudSeverity(undefined)).toBe(false);
      expect(isFraudSeverity(123)).toBe(false);
      expect(isFraudSeverity({})).toBe(false);
    });
  });

  describe('isFraudCategory', () => {
    it('returns true for all valid categories', () => {
      for (const cat of FRAUD_CATEGORIES) {
        expect(isFraudCategory(cat)).toBe(true);
      }
    });

    it('returns false for invalid categories and edge cases', () => {
      expect(isFraudCategory('rapid_join_leave')).toBe(false);
      expect(isFraudCategory('INVALID_CATEGORY')).toBe(false);
      expect(isFraudCategory('')).toBe(false);
      expect(isFraudCategory(null)).toBe(false);
      expect(isFraudCategory(undefined)).toBe(false);
      expect(isFraudCategory({})).toBe(false);
      expect(isFraudCategory(['RAPID_JOIN_LEAVE'])).toBe(false);
    });
  });

  describe('isValidFraudEvent', () => {
    const validEvent: FraudEvent = {
      id: 'evt-101',
      timestamp: 1727800000000,
      category: 'RAPID_JOIN_LEAVE',
      severity: 'medium',
      userId: 'user-42',
      roomId: 'room-alpha',
      details: { attempts: 6, windowSeconds: 30 },
      blocked: false,
    };

    it('validates a complete and correct FraudEvent', () => {
      expect(isValidFraudEvent(validEvent)).toBe(true);
    });

    it('rejects events missing required properties', () => {
      expect(isValidFraudEvent({ ...validEvent, id: undefined })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, timestamp: '1727800000000' })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, category: 'INVALID' })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, severity: 'extreme' })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, userId: 123 })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, details: null })).toBe(false);
      expect(isValidFraudEvent({ ...validEvent, blocked: 'true' })).toBe(false);
    });

    it('rejects null, non-object, and empty values', () => {
      expect(isValidFraudEvent(null)).toBe(false);
      expect(isValidFraudEvent(undefined)).toBe(false);
      expect(isValidFraudEvent({})).toBe(false);
      expect(isValidFraudEvent('event')).toBe(false);
    });
  });

  describe('isValidFraudDetectionResult', () => {
    const validResult: FraudDetectionResult = {
      isSuspicious: true,
      blocked: false,
      score: 65,
      events: [
        {
          id: 'evt-1',
          timestamp: 1727800000000,
          category: 'ACTION_ABUSE',
          severity: 'high',
          userId: 'user-1',
          roomId: 'room-1',
          details: { count: 12 },
          blocked: false,
        },
      ],
      message: 'Elevated activity detected',
    };

    it('validates a correct FraudDetectionResult with message', () => {
      expect(isValidFraudDetectionResult(validResult)).toBe(true);
    });

    it('validates a result without optional message', () => {
      const { message, ...withoutMsg } = validResult;
      expect(isValidFraudDetectionResult(withoutMsg)).toBe(true);
    });

    it('rejects results with malformed event arrays', () => {
      expect(isValidFraudDetectionResult({ ...validResult, events: 'not-an-array' })).toBe(false);
      expect(isValidFraudDetectionResult({ ...validResult, events: [{ invalid: true }] })).toBe(false);
      expect(isValidFraudDetectionResult({ ...validResult, score: '65' })).toBe(false);
      expect(isValidFraudDetectionResult({ ...validResult, isSuspicious: 1 })).toBe(false);
    });
  });

  describe('isValidUserActionContext', () => {
    const validContext: UserActionContext = {
      userId: 'user-99',
      userName: 'Alice',
      roomId: 'room-404',
      timestamp: Date.now(),
      ipAddress: '192.168.1.1',
    };

    it('validates context with optional ipAddress', () => {
      expect(isValidUserActionContext(validContext)).toBe(true);
    });

    it('validates context without optional ipAddress', () => {
      const { ipAddress, ...withoutIp } = validContext;
      expect(isValidUserActionContext(withoutIp)).toBe(true);
    });

    it('rejects context with missing required properties', () => {
      expect(isValidUserActionContext({ ...validContext, userId: undefined })).toBe(false);
      expect(isValidUserActionContext({ ...validContext, roomId: null })).toBe(false);
      expect(isValidUserActionContext({ ...validContext, timestamp: 'now' })).toBe(false);
    });
  });

  describe('isValidConferenceAccessCheck', () => {
    const validAccess: ConferenceAccessCheck = {
      allowed: true,
      reason: 'Verified presenter',
      requiresVerification: false,
    };

    it('validates a complete access check', () => {
      expect(isValidConferenceAccessCheck(validAccess)).toBe(true);
    });

    it('validates minimal access check with only allowed boolean', () => {
      expect(isValidConferenceAccessCheck({ allowed: false })).toBe(true);
    });

    it('rejects invalid structures', () => {
      expect(isValidConferenceAccessCheck({ allowed: 'yes' })).toBe(false);
      expect(isValidConferenceAccessCheck(null)).toBe(false);
      expect(isValidConferenceAccessCheck({ allowed: true, reason: 123 })).toBe(false);
    });
  });

  describe('isValidFraudDetectionConfig', () => {
    const validConfig: FraudDetectionConfig = {
      maxJoinLeavePerMinute: 5,
      maxScreenShareTogglesPerMinute: 4,
      maxCallsPerMinute: 3,
      maxConnectionsPerUser: 2,
      enableStrictMode: false,
      blockOnCriticalThreats: true,
    };

    it('validates a full config object', () => {
      expect(isValidFraudDetectionConfig(validConfig)).toBe(true);
    });

    it('rejects partial or improperly typed configs', () => {
      expect(isValidFraudDetectionConfig({ ...validConfig, maxCallsPerMinute: '3' })).toBe(false);
      expect(isValidFraudDetectionConfig({ ...validConfig, enableStrictMode: null })).toBe(false);
      const { maxJoinLeavePerMinute, ...missingKey } = validConfig;
      expect(isValidFraudDetectionConfig(missingKey)).toBe(false);
    });
  });

  describe('Mocked dependency integration test', () => {
    it('simulates external storage serialization and network payload parsing', async () => {
      // Mock an external storage layer storing FraudEvents
      const mockStorage = {
        getItem: vi.fn().mockResolvedValue(
          JSON.stringify({
            id: 'evt-storage-1',
            timestamp: 1727800000000,
            category: 'SUSPICIOUS_IDENTITY',
            severity: 'critical',
            userId: 'user-suspicious',
            roomId: 'room-audit',
            details: { flag: 'geo-mismatch' },
            blocked: true,
          })
        ),
      };

      const raw = await mockStorage.getItem('latest_fraud_event');
      const parsed = JSON.parse(raw);

      expect(mockStorage.getItem).toHaveBeenCalledWith('latest_fraud_event');
      expect(isValidFraudEvent(parsed)).toBe(true);
      expect(isFraudSeverity(parsed.severity)).toBe(true);
      expect(isFraudCategory(parsed.category)).toBe(true);
    });
  });
});
