import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNumberFormat,
  getDateTimeFormat,
  clearIntlCache,
  getNumberFormatCacheSize,
  getDateTimeFormatCacheSize,
} from '../intlCache';

describe('intlCache', () => {
  beforeEach(() => {
    clearIntlCache();
  });

  describe('getNumberFormat', () => {
    it('returns a valid Intl.NumberFormat instance', () => {
      const formatter = getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      expect(formatter).toBeInstanceOf(Intl.NumberFormat);
      expect(formatter.format(1234.56)).toBe('$1,234.56');
    });

    it('caches formatters by locale and options', () => {
      const formatter1 = getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      const formatter2 = getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      expect(formatter1).toBe(formatter2);
    });

    it('creates separate formatters for different locales', () => {
      const formatterUS = getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      const formatterDE = getNumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
      expect(formatterUS).not.toBe(formatterDE);
      expect(formatterUS.format(1234.56)).toBe('$1,234.56');
      expect(formatterDE.format(1234.56)).toBe('1.234,56 €');
    });

    it('creates separate formatters for different options', () => {
      const formatter1 = getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      const formatter2 = getNumberFormat('en-US', { style: 'percent' });
      expect(formatter1).not.toBe(formatter2);
    });

    it('handles undefined options', () => {
      const formatter = getNumberFormat('en-US');
      expect(formatter.format(1234)).toBe('1,234');
    });
  });

  describe('getDateTimeFormat', () => {
    it('returns a valid Intl.DateTimeFormat instance', () => {
      const formatter = getDateTimeFormat('en-US', { year: 'numeric', month: 'long' });
      expect(formatter).toBeInstanceOf(Intl.DateTimeFormat);
    });

    it('caches formatters by locale and options', () => {
      const formatter1 = getDateTimeFormat('en-US', { year: 'numeric', month: 'long' });
      const formatter2 = getDateTimeFormat('en-US', { year: 'numeric', month: 'long' });
      expect(formatter1).toBe(formatter2);
    });
  });

  describe('cache sizes', () => {
    it('returns correct number format cache size', () => {
      expect(getNumberFormatCacheSize()).toBe(0);
      getNumberFormat('en-US');
      getNumberFormat('en-US', { style: 'currency', currency: 'USD' });
      expect(getNumberFormatCacheSize()).toBe(2);
    });

    it('returns correct date time format cache size', () => {
      expect(getDateTimeFormatCacheSize()).toBe(0);
      getDateTimeFormat('en-US');
      expect(getDateTimeFormatCacheSize()).toBe(1);
    });

    it('clearIntlCache clears both caches', () => {
      getNumberFormat('en-US');
      getDateTimeFormat('en-US');
      expect(getNumberFormatCacheSize()).toBe(1);
      expect(getDateTimeFormatCacheSize()).toBe(1);
      clearIntlCache();
      expect(getNumberFormatCacheSize()).toBe(0);
      expect(getDateTimeFormatCacheSize()).toBe(0);
    });
  });
});

describe('intlCache performance', () => {
  beforeEach(() => {
    clearIntlCache();
  });

  it('cached calls are significantly faster than construction', () => {
    const iterations = 10000;
    const locale = 'en-US';
    const options = { style: 'currency' as const, currency: 'USD' };

    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      new Intl.NumberFormat(locale, options).format(1234.56);
    }
    const timeNew = performance.now() - startNew;

    const formatter = getNumberFormat(locale, options);
    const startCached = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatter.format(1234.56);
    }
    const timeCached = performance.now() - startCached;

    expect(timeCached).toBeLessThan(timeNew / 10);
    expect(timeNew).toBeGreaterThan(timeCached);
  });

  it('cache hit is significantly faster than cache miss (construction)', () => {
    const iterations = 10000;
    const locale = 'en-US';

    const startMiss = performance.now();
    for (let i = 0; i < iterations; i++) {
      getNumberFormat(locale, { maximumFractionDigits: 2 });
    }
    const timeMiss = performance.now() - startMiss;

    const startHit = performance.now();
    for (let i = 0; i < iterations; i++) {
      getNumberFormat(locale, { maximumFractionDigits: 2 });
    }
    const timeHit = performance.now() - startHit;

    expect(timeHit).toBeLessThan(timeMiss / 10);
  });

  it('DateFormatter cache provides performance benefit', () => {
    const iterations = 10000;
    const locale = 'en-US';
    const options = { year: 'numeric' as const, month: 'long' as const };

    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      new Intl.DateTimeFormat(locale, options).format(new Date());
    }
    const timeNew = performance.now() - startNew;

    const formatter = getDateTimeFormat(locale, options);
    const startCached = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatter.format(new Date());
    }
    const timeCached = performance.now() - startCached;

    expect(timeCached).toBeLessThan(timeNew / 10);
  });
});
