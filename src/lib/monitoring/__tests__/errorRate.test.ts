import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ERROR_RATE_WINDOW_MS,
  getErrorRate,
  getErrorRateHistory,
  mergeMetricHistory,
  recordErrorRateSample,
  recordRequestOutcome,
  resetErrorRateTracking,
} from '../metrics';
import { checkAlerts, resetAlertThresholds } from '../alerts';
import { getRecordedMetrics } from '@/lib/logging/performance';
import { Metric } from '../provider';

const START = 1_700_000_000_000;

describe('error-rate tracking', () => {
  beforeEach(() => {
    resetErrorRateTracking();
    resetAlertThresholds();
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetErrorRateTracking();
  });

  it('reports a zero rate before anything is recorded', () => {
    expect(getErrorRate()).toBe(0);
  });

  it('computes the failure percentage of the rolling window', () => {
    recordRequestOutcome(false);
    recordRequestOutcome(false);
    recordRequestOutcome(false);
    const rate = recordRequestOutcome(true);

    expect(rate).toBe(25);
    expect(getErrorRate()).toBe(25);
  });

  it('drops outcomes that fall out of the window', () => {
    recordRequestOutcome(true);
    expect(getErrorRate()).toBe(100);

    vi.setSystemTime(START + DEFAULT_ERROR_RATE_WINDOW_MS + 1);
    expect(getErrorRate()).toBe(0);

    recordRequestOutcome(false);
    expect(getErrorRate()).toBe(0);
  });

  it('honours a custom window', () => {
    recordRequestOutcome(true, { windowMs: 1000 });
    vi.setSystemTime(START + 1500);

    expect(getErrorRate({ windowMs: 1000 })).toBe(0);
  });

  it('keeps metric names isolated from each other', () => {
    recordRequestOutcome(true, { metricName: 'checkout_error_rate' });
    recordRequestOutcome(false);

    expect(getErrorRate({ metricName: 'checkout_error_rate' })).toBe(100);
    expect(getErrorRate()).toBe(0);
  });

  it('publishes each sample to the shared metric store as a percentage', () => {
    recordRequestOutcome(true);

    const recorded = getRecordedMetrics(5).filter((metric) => metric.name === 'error_rate');

    expect(recorded.at(-1)).toMatchObject({ name: 'error_rate', value: 100, unit: 'percent' });
  });

  it('retains samples for the spike baseline, oldest first', () => {
    recordErrorRateSample(0.1);
    vi.setSystemTime(START + 1000);
    recordErrorRateSample(0.2);
    vi.setSystemTime(START + 2000);
    recordErrorRateSample(0.3);

    expect(getErrorRateHistory().map((sample) => sample.value)).toEqual([0.1, 0.2, 0.3]);
  });

  it('caps the retained history', () => {
    for (let i = 0; i < 6; i += 1) {
      vi.setSystemTime(START + i * 1000);
      recordErrorRateSample(i, { historyLimit: 3 });
    }

    expect(getErrorRateHistory('error_rate', 10).map((sample) => sample.value)).toEqual([3, 4, 5]);
  });

  it('clears tracking state on reset', () => {
    recordRequestOutcome(true);
    resetErrorRateTracking();

    expect(getErrorRate()).toBe(0);
    expect(getErrorRateHistory()).toEqual([]);
  });

  it('feeds checkAlerts a baseline that turns a quiet period into a detectable spike', () => {
    for (let i = 0; i < 4; i += 1) {
      vi.setSystemTime(START + i * 1000);
      recordErrorRateSample(0.2);
    }

    const history = getErrorRateHistory();
    vi.setSystemTime(START + 5000);
    const latest = [recordErrorRateSample(2)];

    const alerts = checkAlerts(latest, { history });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('Error rate spiked to 2%');
  });
});

describe('mergeMetricHistory', () => {
  const sample = (value: number, timestamp: number): Metric => ({
    name: 'error_rate',
    value,
    timestamp,
  });

  it('appends new samples and drops ones already seen', () => {
    const history = [sample(1, START), sample(2, START + 1000)];
    const merged = mergeMetricHistory(
      history,
      [sample(2, START + 1000), sample(3, START + 2000)],
      10,
    );

    expect(merged.map((entry) => entry.value)).toEqual([1, 2, 3]);
  });

  it('keeps only the most recent samples up to the limit', () => {
    const history = [sample(1, START), sample(2, START + 1000)];
    const merged = mergeMetricHistory(history, [sample(3, START + 2000)], 2);

    expect(merged.map((entry) => entry.value)).toEqual([2, 3]);
  });
});
