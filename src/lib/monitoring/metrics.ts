import { useEffect, useState } from 'react';
import { LocalMonitoringProvider, Metric } from './provider';
import { createCounterMetric } from '@/lib/logging/performance';

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
