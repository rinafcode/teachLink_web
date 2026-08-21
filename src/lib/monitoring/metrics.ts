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
