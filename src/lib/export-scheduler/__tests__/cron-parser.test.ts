/**
 * Tests for Cron Parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseCronExpression,
  validateCronExpression,
  frequencyToCron,
  getNextRunTime,
} from '../cron-parser';

describe('Cron Parser', () => {
  describe('parseCronExpression', () => {
    it('should parse valid cron expression', () => {
      const result = parseCronExpression('0 0 * * *');
      expect(result).toEqual({
        minute: '0',
        hour: '0',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '*',
      });
    });

    it('should throw error for invalid expression', () => {
      expect(() => parseCronExpression('invalid')).toThrow();
      expect(() => parseCronExpression('0 0 *')).toThrow();
    });
  });

  describe('validateCronExpression', () => {
    it('should validate correct expressions', () => {
      expect(validateCronExpression('0 0 * * *')).toBe(true);
      expect(validateCronExpression('*/5 * * * *')).toBe(true);
      expect(validateCronExpression('0 0 1 * *')).toBe(true);
      expect(validateCronExpression('0 0 * * 0')).toBe(true);
    });

    it('should reject invalid expressions', () => {
      expect(validateCronExpression('invalid')).toBe(false);
      expect(validateCronExpression('60 0 * * *')).toBe(false);
      expect(validateCronExpression('0 25 * * *')).toBe(false);
    });
  });

  describe('frequencyToCron', () => {
    it('should convert frequency to cron', () => {
      expect(frequencyToCron('daily')).toBe('0 0 * * *');
      expect(frequencyToCron('weekly')).toBe('0 0 * * 0');
      expect(frequencyToCron('monthly')).toBe('0 0 1 * *');
    });
  });

  describe('getNextRunTime', () => {
    it('should calculate next run time', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const next = getNextRunTime('0 0 * * *', now);
      expect(next).toBeInstanceOf(Date);
      expect(next.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
