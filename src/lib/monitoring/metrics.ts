import { useEffect, useMemo, useRef, useState } from 'react';
import { LocalMonitoringProvider, Metric } from './provider';
import { createCounterMetric, recordMetric } from '@/lib/logging/performance';
import { Alert, AlertThresholdOverrides, ERROR_RATE_METRIC, checkAlerts } from './alerts';

const provider = new LocalMonitoringProvider();

/**
 * Record a realtime reliability metric (e.g. `reconnect_attempt`, `reconnect_success`,
 * `heartbeat_timeout`, `queue_dropped`, `realtime_offline`). Metrics are surfaced
 * through `useMetrics()` and evaluated by `checkAlerts()`.
 */
export function recordRealtimeMetric(
  name: string,
  value: number = 1,
  tags?: Record<string, string | number | boolean>,
): void {
  createCounterMetric(name, value, tags);
}

/**
 * Authentication lifecycle events emitted by the token manager. Kept as a union
 * so dashboards and alerts can query a stable, documented set of metric names.
 */
export type AuthMetricName =
  | 'auth.refresh_success'
  | 'auth.refresh_failure'
  | 'auth.token_rotated'
  | 'auth.forced_logout';

/**
 * Record an auth lifecycle metric as a counter. Used by the token manager so
 * refresh success/failure, rotation and forced logout are observable in the
 * same monitoring pipeline as the rest of the app.
 */
export function recordAuthMetric(
  name: AuthMetricName,
  tags?: Record<string, string | number | boolean>,
): void {
  createCounterMetric(name, 1, tags);
}

/** Circuit breaker state machine states. */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Record a circuit breaker state transition as a counter. The metric is
 * named `circuit_breaker.state_change` and tagged with the previous and new
 * states so dashboards can count each transition independently.
 */
export function recordCircuitBreakerStateChange(
  previousState: CircuitBreakerState,
  newState: CircuitBreakerState,
  tags?: Record<string, string | number | boolean>,
): void {
  createCounterMetric('circuit_breaker.state_change', 1, {
    from: previousState,
    to: newState,
    ...tags,
  });
}

/** Rolling window used to turn individual request outcomes into a rate. */
export const DEFAULT_ERROR_RATE_WINDOW_MS = 60_000;

/** Error-rate samples retained per metric for spike baselines. */
export const DEFAULT_ERROR_RATE_HISTORY_LIMIT = 60;

export interface ErrorRateOptions {
  /** Metric name to record the rate under. Defaults to `error_rate`. */
  metricName?: string;
  /** Rolling window the rate is computed over. Defaults to 60s. */
  windowMs?: number;
  /** Samples retained for spike baselines. Defaults to 60. */
  historyLimit?: number;
  tags?: Record<string, string | number | boolean>;
}

type RequestOutcome = { timestamp: number; isError: boolean };

const outcomeWindows = new Map<string, RequestOutcome[]>();
const errorRateHistory = new Map<string, Metric[]>();

function pruneWindow(metricName: string, windowMs: number, now: number): RequestOutcome[] {
  const cutoff = now - windowMs;
  const outcomes = (outcomeWindows.get(metricName) ?? []).filter(
    (outcome) => outcome.timestamp > cutoff,
  );

  outcomeWindows.set(metricName, outcomes);

  return outcomes;
}

/** Percentage of failed requests in the rolling window, without recording a sample. */
export function getErrorRate(options: ErrorRateOptions = {}): number {
  const { metricName = ERROR_RATE_METRIC, windowMs = DEFAULT_ERROR_RATE_WINDOW_MS } = options;
  const outcomes = pruneWindow(metricName, windowMs, Date.now());

  if (outcomes.length === 0) return 0;

  const errors = outcomes.filter((outcome) => outcome.isError).length;

  return Number(((errors / outcomes.length) * 100).toFixed(2));
}

/**
 * Record a pre-computed error rate (percentage) so it reaches `useMetrics()`
 * and the spike baselines used by `checkAlerts()`.
 */
export function recordErrorRateSample(rate: number, options: ErrorRateOptions = {}): Metric {
  const {
    metricName = ERROR_RATE_METRIC,
    historyLimit = DEFAULT_ERROR_RATE_HISTORY_LIMIT,
    tags,
  } = options;

  const recorded = recordMetric({
    name: metricName,
    value: rate,
    unit: 'percent',
    timestamp: Date.now(),
    tags,
  });

  const sample: Metric = {
    name: recorded.name,
    value: recorded.value,
    timestamp: recorded.timestamp,
    unit: recorded.unit,
    tags: recorded.tags,
  };

  const history = [...(errorRateHistory.get(metricName) ?? []), sample].slice(-historyLimit);
  errorRateHistory.set(metricName, history);

  return sample;
}

/**
 * Record the outcome of a single request and emit the resulting error rate for
 * the rolling window. Returns the rate so callers can react inline.
 */
export function recordRequestOutcome(isError: boolean, options: ErrorRateOptions = {}): number {
  const { metricName = ERROR_RATE_METRIC, windowMs = DEFAULT_ERROR_RATE_WINDOW_MS } = options;
  const now = Date.now();
  const outcomes = pruneWindow(metricName, windowMs, now);

  outcomes.push({ timestamp: now, isError });
  outcomeWindows.set(metricName, outcomes);

  const rate = getErrorRate(options);
  recordErrorRateSample(rate, options);

  return rate;
}

/** Recorded error-rate samples, oldest first. Used as the spike baseline. */
export function getErrorRateHistory(
  metricName: string = ERROR_RATE_METRIC,
  limit: number = DEFAULT_ERROR_RATE_HISTORY_LIMIT,
): Metric[] {
  return (errorRateHistory.get(metricName) ?? []).slice(-limit);
}

/** Clear the rolling window and recorded samples. Primarily for tests. */
export function resetErrorRateTracking(metricName?: string): void {
  if (metricName) {
    outcomeWindows.delete(metricName);
    errorRateHistory.delete(metricName);
    return;
  }

  outcomeWindows.clear();
  errorRateHistory.clear();
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await provider.getMetrics();
      setMetrics(data);
    };

    void fetchMetrics();
    const interval = setInterval(() => {
      void fetchMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/** Samples retained across polls so `useMetricAlerts` can detect spikes. */
export const DEFAULT_ALERT_HISTORY_LIMIT = 200;

export interface UseMetricAlertsOptions {
  /** Threshold overrides merged over the configured defaults. */
  thresholds?: AlertThresholdOverrides;
  /** Samples retained across polls. Defaults to 200. */
  historyLimit?: number;
}

/**
 * Merge a poll into the retained history, dropping samples already seen so a
 * baseline is built from distinct observations rather than repeated snapshots.
 */
export function mergeMetricHistory(history: Metric[], incoming: Metric[], limit: number): Metric[] {
  const seen = new Set(
    history.map((sample) => `${sample.name}|${sample.timestamp}|${sample.value}`),
  );
  const merged = [...history];

  incoming.forEach((sample) => {
    const key = `${sample.name}|${sample.timestamp}|${sample.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(sample);
  });

  return merged.slice(-limit);
}

/**
 * Poll metrics and evaluate them against the alert thresholds. Samples from
 * earlier polls are retained so an error-rate spike is measured against the
 * preceding baseline rather than a single snapshot.
 */
export function useMetricAlerts(options: UseMetricAlertsOptions = {}): {
  metrics: Metric[];
  alerts: Alert[];
} {
  const { thresholds, historyLimit = DEFAULT_ALERT_HISTORY_LIMIT } = options;
  const metrics = useMetrics();
  const historyRef = useRef<Metric[]>([]);
  const thresholdsRef = useRef(thresholds);

  thresholdsRef.current = thresholds;

  // Evaluated against the history captured before this poll, so the newest
  // samples are never part of their own baseline.
  const alerts = useMemo(
    () => checkAlerts(metrics, { thresholds: thresholdsRef.current, history: historyRef.current }),
    [metrics],
  );

  useEffect(() => {
    historyRef.current = mergeMetricHistory(historyRef.current, metrics, historyLimit);
  }, [metrics, historyLimit]);

  return { metrics, alerts };
}
