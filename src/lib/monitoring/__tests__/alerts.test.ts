import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ALERT_THRESHOLDS,
  checkAlerts,
  configureAlertThresholds,
  getAlertThresholds,
  resetAlertThresholds,
  resolveAlertThresholds,
} from '../alerts';
import { Metric } from '../provider';

const BASE_TIMESTAMP = 1_700_000_000_000;

function errorRateSamples(values: number[], name = 'error_rate'): Metric[] {
  return values.map((value, index) => ({
    name,
    value,
    timestamp: BASE_TIMESTAMP + index * 1000,
  }));
}

describe('resolveAlertThresholds', () => {
  it('returns the defaults when nothing is overridden', () => {
    expect(resolveAlertThresholds()).toEqual(DEFAULT_ALERT_THRESHOLDS);
  });

  it('merges scalar overrides without dropping the error-rate config', () => {
    const thresholds = resolveAlertThresholds({ responseTime: 900 });

    expect(thresholds.responseTime).toBe(900);
    expect(thresholds.errorRates.error_rate.warning).toBe(
      DEFAULT_ALERT_THRESHOLDS.errorRates.error_rate.warning,
    );
  });

  it('merges partial error-rate overrides over the defaults', () => {
    const thresholds = resolveAlertThresholds({ errorRates: { error_rate: { warning: 1 } } });

    expect(thresholds.errorRates.error_rate.warning).toBe(1);
    expect(thresholds.errorRates.error_rate.critical).toBe(
      DEFAULT_ALERT_THRESHOLDS.errorRates.error_rate.critical,
    );
    expect(thresholds.errorRates.error_rate.label).toBe('Error rate');
  });

  it('registers an unknown error-rate metric with the default spike settings', () => {
    const thresholds = resolveAlertThresholds({
      errorRates: { checkout_error_rate: { warning: 2 } },
    });

    expect(thresholds.errorRates.checkout_error_rate).toMatchObject({
      label: 'checkout_error_rate',
      warning: 2,
      spikeMultiplier: DEFAULT_ALERT_THRESHOLDS.errorRates.error_rate.spikeMultiplier,
    });
  });

  it('does not mutate the defaults', () => {
    resolveAlertThresholds({ errorRates: { error_rate: { warning: 42 } } });

    expect(DEFAULT_ALERT_THRESHOLDS.errorRates.error_rate.warning).toBe(3);
  });
});

describe('configureAlertThresholds', () => {
  beforeEach(() => {
    resetAlertThresholds();
  });

  it('applies to later checks until reset', () => {
    expect(checkAlerts(errorRateSamples([2]))).toHaveLength(0);

    configureAlertThresholds({ errorRates: { error_rate: { warning: 1 } } });
    expect(getAlertThresholds().errorRates.error_rate.warning).toBe(1);
    expect(checkAlerts(errorRateSamples([2]))).toHaveLength(1);

    resetAlertThresholds();
    expect(checkAlerts(errorRateSamples([2]))).toHaveLength(0);
  });
});

describe('checkAlerts — error-rate thresholds', () => {
  beforeEach(() => {
    resetAlertThresholds();
  });

  it('stays quiet while the error rate is under the warning threshold', () => {
    expect(checkAlerts(errorRateSamples([0.5, 1, 2.9]))).toHaveLength(0);
  });

  it('raises a high alert once the error rate passes the warning threshold', () => {
    const alerts = checkAlerts(errorRateSamples([4]));

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      message: 'Error rate is above threshold',
      severity: 'high',
      metric: 'error_rate',
      value: 4,
      threshold: 3,
    });
  });

  it('escalates to critical past the critical threshold', () => {
    const alerts = checkAlerts(errorRateSamples([12]));
    const absolute = alerts.find((alert) => alert.message.includes('above threshold'));

    expect(absolute).toMatchObject({ severity: 'critical', threshold: 10 });
    expect(absolute?.message).toContain('Error rate is above threshold');
  });

  it('evaluates only the newest sample so a recovered rate stops alerting', () => {
    const alerts = checkAlerts(errorRateSamples([9, 8, 0.1]));

    expect(alerts).toHaveLength(0);
  });

  it('honours per-call threshold overrides', () => {
    const alerts = checkAlerts(errorRateSamples([2]), {
      thresholds: { errorRates: { error_rate: { warning: 1 } } },
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('high');
  });

  it('applies thresholds to a caller-registered error-rate metric', () => {
    const alerts = checkAlerts(errorRateSamples([5], 'checkout_error_rate'), {
      thresholds: {
        errorRates: { checkout_error_rate: { label: 'Checkout error rate', warning: 2 } },
      },
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toBe('Checkout error rate is above threshold');
  });
});

describe('checkAlerts — error-rate spikes', () => {
  beforeEach(() => {
    resetAlertThresholds();
  });

  it('flags a spike over the rolling baseline even below the absolute threshold', () => {
    const alerts = checkAlerts(errorRateSamples([0.2, 0.2, 0.3, 0.3, 2]));

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ severity: 'high', metric: 'error_rate', value: 2 });
    expect(alerts[0].message).toContain('Error rate spiked to 2%');
    expect(alerts[0].message).toContain('baseline 0.25%');
  });

  it('builds the baseline from history when each poll carries one sample', () => {
    const history = errorRateSamples([0.1, 0.1, 0.1, 0.1]);
    const latest: Metric[] = [{ name: 'error_rate', value: 1.5, timestamp: BASE_TIMESTAMP + 9000 }];

    const alerts = checkAlerts(latest, { history });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('Error rate spiked to 1.5%');
  });

  it('ignores history at or after the newest sample so a spike is not its own baseline', () => {
    const latest: Metric[] = [{ name: 'error_rate', value: 2, timestamp: BASE_TIMESTAMP }];
    const history: Metric[] = [
      { name: 'error_rate', value: 2, timestamp: BASE_TIMESTAMP },
      { name: 'error_rate', value: 2, timestamp: BASE_TIMESTAMP + 1000 },
      { name: 'error_rate', value: 2, timestamp: BASE_TIMESTAMP + 2000 },
    ];

    expect(checkAlerts(latest, { history })).toHaveLength(0);
  });

  it('waits for enough baseline samples before calling anything a spike', () => {
    expect(checkAlerts(errorRateSamples([0.2, 2]))).toHaveLength(0);
  });

  it('ignores spikes below the noise floor', () => {
    expect(checkAlerts(errorRateSamples([0.01, 0.01, 0.01, 0.01, 0.5]))).toHaveLength(0);
  });

  it('treats a rise from a zero baseline as a spike', () => {
    const alerts = checkAlerts(errorRateSamples([0, 0, 0, 0, 1.5]));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('baseline 0%');
  });

  it('reports both the absolute breach and the spike when a rate jumps hard', () => {
    const alerts = checkAlerts(errorRateSamples([0.2, 0.2, 0.2, 0.2, 12]));

    expect(alerts).toHaveLength(2);
    expect(alerts.map((alert) => alert.severity)).toEqual(['critical', 'critical']);
    expect(alerts[0].message).toContain('Error rate is above threshold');
    expect(alerts[1].message).toContain('Error rate spiked to 12%');
  });

  it('respects a configured spike multiplier', () => {
    const samples = errorRateSamples([1, 1, 1, 1, 2.5]);

    expect(checkAlerts(samples)).toHaveLength(0);
    expect(
      checkAlerts(samples, { thresholds: { errorRates: { error_rate: { spikeMultiplier: 2 } } } }),
    ).toHaveLength(1);
  });

  it('keeps error-rate metrics independent of each other', () => {
    const alerts = checkAlerts([
      ...errorRateSamples([0.2, 0.2, 0.2, 0.2, 2]),
      ...errorRateSamples([0.2, 0.2, 0.2, 0.2, 0.2], 'zoom_api_error_rate'),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].metric).toBe('error_rate');
  });
});

describe('checkAlerts — existing metrics', () => {
  beforeEach(() => {
    resetAlertThresholds();
  });

  it('still alerts on slow responses and honours an override', () => {
    const metrics: Metric[] = [{ name: 'response_time', value: 500, timestamp: BASE_TIMESTAMP }];

    expect(checkAlerts(metrics)).toHaveLength(1);
    expect(checkAlerts(metrics, { thresholds: { responseTime: 800 } })).toHaveLength(0);
  });

  it('still alerts on realtime transport failures', () => {
    const alerts = checkAlerts([
      { name: 'realtime_offline', value: 1, timestamp: BASE_TIMESTAMP },
      { name: 'heartbeat_timeout', value: 1, timestamp: BASE_TIMESTAMP },
    ]);

    expect(alerts).toHaveLength(2);
    expect(alerts[0].severity).toBe('high');
    expect(alerts[1].severity).toBe('low');
  });
});
