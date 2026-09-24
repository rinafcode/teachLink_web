import { describe, it, expect } from 'vitest';
import { isValidDate, formatDate, formatShortDate, formatTime, formatRelative } from '../dateUtils';

describe('isValidDate', () => {
  it('returns true for valid Date objects', () => {
    expect(isValidDate(new Date('2024-01-15'))).toBe(true);
  });

  it('returns true for valid date strings', () => {
    expect(isValidDate('2024-01-15')).toBe(true);
  });

  it('returns true for valid timestamps', () => {
    expect(isValidDate(1705276800000)).toBe(true);
  });

  it('returns false for invalid date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(isValidDate('')).toBe(false);
  });

  it('returns false for random non-date strings', () => {
    expect(isValidDate('hello world')).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats a valid date', () => {
    const result = formatDate(new Date('2024-01-15'), 'en-US');
    expect(result).toBe('January 15, 2024');
  });

  it('formats a valid date string', () => {
    const result = formatDate('2024-01-15', 'en-US');
    expect(result).toBe('January 15, 2024');
  });

  it('returns empty string for invalid input by default', () => {
    expect(formatDate('not-a-date', 'en-US')).toBe('');
  });

  it('returns custom fallback for invalid input', () => {
    expect(formatDate('not-a-date', 'en-US', undefined, 'N/A')).toBe('N/A');
  });

  it('returns empty string for null-like inputs', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('formatShortDate', () => {
  it('formats a valid date in short format', () => {
    const result = formatShortDate(new Date('2024-01-15'), 'en-US');
    expect(result).toBe('Jan 15, 2024');
  });

  it('returns empty string for invalid input', () => {
    expect(formatShortDate('not-a-date', 'en-US')).toBe('');
  });

  it('returns custom fallback for invalid input', () => {
    expect(formatShortDate('not-a-date', 'en-US', '--')).toBe('--');
  });
});

describe('formatTime', () => {
  it('formats a valid date to time', () => {
    const result = formatTime(new Date('2024-01-15T14:30:00'), 'en-US');
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it('returns empty string for invalid input', () => {
    expect(formatTime('not-a-date', 'en-US')).toBe('');
  });

  it('returns custom fallback for invalid input', () => {
    expect(formatTime('invalid', 'en-US', 'N/A')).toBe('N/A');
  });
});

describe('formatRelative', () => {
  it('returns relative time for a valid date', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const result = formatRelative(fiveMinutesAgo, 'en-US');
    expect(result).toBe('5 minutes ago');
  });

  it('returns "now" for a very recent date', () => {
    const result = formatRelative(new Date(), 'en-US');
    expect(result).toMatch(/seconds? ago|now/);
  });

  it('returns empty string for invalid input', () => {
    expect(formatRelative('not-a-date', 'en-US')).toBe('');
  });

  it('returns custom fallback for invalid input', () => {
    expect(formatRelative('garbage', 'en-US', 'unknown')).toBe('unknown');
  });
});
