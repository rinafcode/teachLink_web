/**
 * Unit Tests for performanceUtils
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  metricFromWebVital,
  appendTrendPoint,
  loadTrendHistory,
  clearTrendHistory,
  evaluatePerformanceDegradation,
  formatMetricValue,
  buildOptimizationSuggestions,
  trackDuration,
  trackDurationAsync,
  markPerformancePhase,
  measurePerformancePhase,
  runWhenIdle,
  type PerformanceMetric,
  type PerformanceTrendPoint,
} from '../performanceUtils';
import type { Metric } from 'web-vitals';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMetric(overrides: Partial<PerformanceMetric> = {}): PerformanceMetric {
  return {
    name: 'LCP',
    value: 2500,
    rating: 'good',
    id: 'v3-abc',
    delta: 100,
    label: 'ms',
    ...overrides,
  };
}

function makeWebVitalMetric(overrides: Partial<Metric> = {}): Metric {
  return {
    name: 'LCP',
    value: 2500,
    rating: 'good',
    id: 'v3-abc',
    delta: 100,
    navigationType: 'navigate',
    entries: [],
    ...overrides,
  } as Metric;
}

// ---------------------------------------------------------------------------
// metricFromWebVital
// ---------------------------------------------------------------------------
describe('metricFromWebVital', () => {
  it('maps all fields correctly', () => {
    const wv = makeWebVitalMetric();
    const pm = metricFromWebVital(wv);
    expect(pm.name).toBe('LCP');
    expect(pm.value).toBe(2500);
    expect(pm.rating).toBe('good');
    expect(pm.id).toBe('v3-abc');
    expect(pm.delta).toBe(100);
    expect(pm.label).toBe('ms');
  });

  it('sets label to undefined for CLS', () => {
    const wv = makeWebVitalMetric({ name: 'CLS' } as Partial<Metric>);
    const pm = metricFromWebVital(wv);
    expect(pm.label).toBeUndefined();
  });

  it('sets label to "ms" for non-CLS metrics', () => {
    const pm = metricFromWebVital(makeWebVitalMetric({ name: 'FCP' } as Partial<Metric>));
    expect(pm.label).toBe('ms');
  });
});

// ---------------------------------------------------------------------------
// formatMetricValue
// ---------------------------------------------------------------------------
describe('formatMetricValue', () => {
  it('formats CLS to 3 decimal places', () => {
    const result = formatMetricValue({ name: 'CLS', value: 0.12345 } as PerformanceMetric);
    expect(result).toBe('0.123');
  });

  it('formats LCP with ms suffix', () => {
    const result = formatMetricValue({ name: 'LCP', value: 2500, label: 'ms' } as PerformanceMetric);
    expect(result).toBe('2500ms');
  });

  it('uses label from metric when present', () => {
    const result = formatMetricValue({ name: 'TTFB', value: 800, label: 'ms' } as PerformanceMetric);
    expect(result).toBe('800ms');
  });

  it('falls back to "ms" when label is absent', () => {
    const result = formatMetricValue({ name: 'FCP', value: 1200 } as PerformanceMetric);
    expect(result).toBe('1200ms');
  });
});

// ---------------------------------------------------------------------------
// evaluatePerformanceDegradation
// ---------------------------------------------------------------------------
describe('evaluatePerformanceDegradation', () => {
  it('returns null for "good" rating', () => {
    expect(evaluatePerformanceDegradation(makeMetric({ rating: 'good' }))).toBeNull();
  });

  it('returns null when rating is absent', () => {
    expect(evaluatePerformanceDegradation(makeMetric({ rating: undefined }))).toBeNull();
  });

  it('returns critical alert for "poor" rating', () => {
    const alert = evaluatePerformanceDegradation(makeMetric({ rating: 'poor' }));
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('critical');
    expect(alert!.metricName).toBe('LCP');
  });

  it('returns warning alert for "needs-improvement" rating', () => {
    const alert = evaluatePerformanceDegradation(makeMetric({ rating: 'needs-improvement' }));
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('warning');
  });

  it('alert has required fields', () => {
    const alert = evaluatePerformanceDegradation(makeMetric({ rating: 'poor' }));
    expect(alert).toHaveProperty('id');
    expect(alert).toHaveProperty('at');
    expect(alert).toHaveProperty('message');
    expect(alert!.at).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildOptimizationSuggestions
// ---------------------------------------------------------------------------
describe('buildOptimizationSuggestions', () => {
  it('returns empty array when all metrics are good', () => {
    const metrics = {
      LCP: makeMetric({ name: 'LCP', rating: 'good' }),
      INP: makeMetric({ name: 'INP', rating: 'good' }),
      CLS: makeMetric({ name: 'CLS', rating: 'good' }),
      FCP: makeMetric({ name: 'FCP', rating: 'good' }),
      TTFB: makeMetric({ name: 'TTFB', rating: 'good' }),
    };
    const suggestions = buildOptimizationSuggestions(metrics);
    // may still include network suggestion; just check LCP/INP/CLS/FCP/TTFB are absent
    const ids = suggestions.map((s) => s.id);
    expect(ids).not.toContain('lcp-hero');
    expect(ids).not.toContain('inp-main-thread');
    expect(ids).not.toContain('cls-layout');
  });

  it('suggests LCP fix when LCP is poor', () => {
    const metrics = { LCP: makeMetric({ name: 'LCP', rating: 'poor' }) };
    const suggestions = buildOptimizationSuggestions(metrics);
    expect(suggestions.some((s) => s.id === 'lcp-hero')).toBe(true);
  });

  it('suggests INP fix when INP needs improvement', () => {
    const metrics = { INP: makeMetric({ name: 'INP', rating: 'needs-improvement' }) };
    const suggestions = buildOptimizationSuggestions(metrics);
    expect(suggestions.some((s) => s.id === 'inp-main-thread')).toBe(true);
  });

  it('suggests CLS fix when CLS is poor', () => {
    const metrics = { CLS: makeMetric({ name: 'CLS', rating: 'poor' }) };
    const suggestions = buildOptimizationSuggestions(metrics);
    expect(suggestions.some((s) => s.id === 'cls-layout')).toBe(true);
  });

  it('each suggestion has required fields', () => {
    const metrics = { LCP: makeMetric({ name: 'LCP', rating: 'poor' }) };
    buildOptimizationSuggestions(metrics).forEach((s) => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('detail');
      expect(s).toHaveProperty('impact');
    });
  });

  it('does not duplicate suggestions', () => {
    const metrics = {
      LCP: makeMetric({ name: 'LCP', rating: 'poor' }),
    };
    const suggestions = buildOptimizationSuggestions(metrics);
    const ids = suggestions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// appendTrendPoint / loadTrendHistory / clearTrendHistory
// ---------------------------------------------------------------------------
describe('trend history (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const point = (): PerformanceTrendPoint => ({
    t: Date.now(),
    name: 'LCP',
    value: 2500,
    rating: 'good',
  });

  it('appends a point and returns the updated list', () => {
    const result = appendTrendPoint(point());
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('LCP');
  });

  it('loadTrendHistory returns empty array when nothing stored', () => {
    expect(loadTrendHistory()).toEqual([]);
  });

  it('loadTrendHistory returns stored points', () => {
    appendTrendPoint(point());
    appendTrendPoint(point());
    expect(loadTrendHistory()).toHaveLength(2);
  });

  it('clearTrendHistory empties the store', () => {
    appendTrendPoint(point());
    clearTrendHistory();
    expect(loadTrendHistory()).toEqual([]);
  });

  it('caps stored points at 200', () => {
    for (let i = 0; i < 210; i++) {
      appendTrendPoint({ t: i, name: 'FCP', value: i });
    }
    expect(loadTrendHistory().length).toBeLessThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// trackDuration / trackDurationAsync
// ---------------------------------------------------------------------------
describe('trackDuration', () => {
  it('returns the result of the wrapped function', () => {
    const result = trackDuration('test', () => 42);
    expect(result).toBe(42);
  });

  it('works with functions that return objects', () => {
    const result = trackDuration('obj', () => ({ ok: true }));
    expect(result).toEqual({ ok: true });
  });
});

describe('trackDurationAsync', () => {
  it('returns the resolved value', async () => {
    const result = await trackDurationAsync('async-test', async () => 'hello');
    expect(result).toBe('hello');
  });

  it('propagates rejections', async () => {
    await expect(
      trackDurationAsync('fail', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});

// ---------------------------------------------------------------------------
// markPerformancePhase / measurePerformancePhase
// ---------------------------------------------------------------------------
describe('markPerformancePhase / measurePerformancePhase', () => {
  it('does not throw when called', () => {
    expect(() => markPerformancePhase('start-mark')).not.toThrow();
  });

  it('measurePerformancePhase returns a number or null', () => {
    markPerformancePhase('phase-start');
    markPerformancePhase('phase-end');
    const duration = measurePerformancePhase('phase-measure', 'phase-start', 'phase-end');
    expect(duration === null || typeof duration === 'number').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runWhenIdle
// ---------------------------------------------------------------------------
describe('runWhenIdle', () => {
  it('calls the callback', async () => {
    const cb = vi.fn();
    runWhenIdle(cb, 100);
    // jsdom doesn't have requestIdleCallback; falls back to setTimeout(cb, 1)
    await vi.waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
  });
});
