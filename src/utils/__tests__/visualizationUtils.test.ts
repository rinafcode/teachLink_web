/**
 * Tests for Visualization Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatPercentage,
  generateDateLabels,
  calculateMovingAverage,
  normalizeData,
  calculateTrend,
  calculateStatistics,
  generateSampleData,
} from '../visualizationUtils';

describe('visualizationUtils', () => {
  describe('formatNumber', () => {
    it('should format numbers with K suffix', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format numbers with M suffix', () => {
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(2300000)).toBe('2.3M');
    });

    it('should format numbers with B suffix', () => {
      expect(formatNumber(1500000000)).toBe('1.5B');
      expect(formatNumber(3200000000)).toBe('3.2B');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(45.678)).toBe('45.7%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(45.678, 2)).toBe('45.68%');
      expect(formatPercentage(45.678, 0)).toBe('46%');
    });
  });

  describe('generateDateLabels', () => {
    it('should generate 7 day labels', () => {
      const labels = generateDateLabels('7d');
      expect(labels).toHaveLength(7);
    });

    it('should generate 30 day labels', () => {
      const labels = generateDateLabels('30d');
      expect(labels).toHaveLength(30);
    });

    it('should generate labels in short format', () => {
      const labels = generateDateLabels('7d', 'short');
      expect(labels[0]).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(data, 3);

      expect(result[0]).toBe(10); // (10) / 1
      expect(result[1]).toBe(15); // (10 + 20) / 2
      expect(result[2]).toBe(20); // (10 + 20 + 30) / 3
      expect(result[3]).toBe(30); // (20 + 30 + 40) / 3
      expect(result[4]).toBe(40); // (30 + 40 + 50) / 3
    });

    it('should handle window size of 1', () => {
      const data = [10, 20, 30];
      const result = calculateMovingAverage(data, 1);
      expect(result).toEqual(data);
    });
  });

  describe('normalizeData', () => {
    it('should normalize data to 0-100 scale', () => {
      const data = [10, 50, 90];
      const result = normalizeData(data);

      expect(result[0]).toBe(0);
      expect(result[1]).toBe(50);
      expect(result[2]).toBe(100);
    });

    it('should handle identical values', () => {
      const data = [50, 50, 50];
      const result = normalizeData(data);

      expect(result).toEqual([50, 50, 50]);
    });

    it('should handle negative values', () => {
      const data = [-10, 0, 10];
      const result = normalizeData(data);

      expect(result[0]).toBe(0);
      expect(result[1]).toBe(50);
      expect(result[2]).toBe(100);
    });
  });

  describe('calculateTrend', () => {
    it('should detect upward trend', () => {
      const data = [100, 110, 120, 130];
      const result = calculateTrend(data);

      expect(result.direction).toBe('up');
      expect(result.percentage).toBeGreaterThan(0);
    });

    it('should detect downward trend', () => {
      const data = [100, 90, 80, 70];
      const result = calculateTrend(data);

      expect(result.direction).toBe('down');
      expect(result.percentage).toBeGreaterThan(0);
    });

    it('should detect neutral trend', () => {
      const data = [100, 100.5, 100.2, 100.3];
      const result = calculateTrend(data);

      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
    });

    it('should handle insufficient data', () => {
      const data = [100];
      const result = calculateTrend(data);

      expect(result.direction).toBe('neutral');
      expect(result.percentage).toBe(0);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate correct statistics', () => {
      const data = [10, 20, 30, 40, 50];
      const stats = calculateStatistics(data);

      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
    });

    it('should calculate median for even number of values', () => {
      const data = [10, 20, 30, 40];
      const stats = calculateStatistics(data);

      expect(stats.median).toBe(25);
    });

    it('should calculate mode correctly', () => {
      const data = [10, 20, 20, 30, 40];
      const stats = calculateStatistics(data);

      expect(stats.mode).toBe(20);
    });

    it('should calculate standard deviation', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const stats = calculateStatistics(data);

      expect(stats.stdDev).toBeCloseTo(2, 0);
    });
  });

  describe('generateSampleData', () => {
    it('should generate correct number of points', () => {
      const data = generateSampleData(10);
      expect(data).toHaveLength(10);
    });

    it('should generate values within range', () => {
      const data = generateSampleData(100, 50, 100);

      data.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(50);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should generate different values', () => {
      const data = generateSampleData(10, 0, 100);
      const uniqueValues = new Set(data);

      // With high probability, not all values should be the same
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });
});
