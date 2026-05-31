import { PerformanceMetric } from './types';

declare global {
  var __TEACHLINK_METRICS__: PerformanceMetric[] | undefined;
}

function getMetricStore(): PerformanceMetric[] {
  if (!globalThis.__TEACHLINK_METRICS__) {
    globalThis.__TEACHLINK_METRICS__ = [];
  }

  return globalThis.__TEACHLINK_METRICS__;
}

export function recordMetric(metric: PerformanceMetric): PerformanceMetric {
  const store = getMetricStore();
  store.push(metric);

  if (store.length > 200) {
    store.splice(0, store.length - 200);
  }

  return metric;
}

export function getRecordedMetrics(limit: number = 50): PerformanceMetric[] {
  const store = getMetricStore();
  return store.slice(-limit);
}

export function createCounterMetric(
  name: string,
  value: number = 1,
  tags?: PerformanceMetric['tags'],
): PerformanceMetric {
  return recordMetric({
    name,
    value,
    unit: 'count',
    timestamp: Date.now(),
    tags,
  });
}

export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  tags?: PerformanceMetric['tags'],
): Promise<{ result: T; metric: PerformanceMetric }> {
  const start = globalThis.performance?.now?.() ?? Date.now();
  const result = await operation();
  const end = globalThis.performance?.now?.() ?? Date.now();
  const metric = recordMetric({
    name,
    value: Number((end - start).toFixed(2)),
    unit: 'ms',
    timestamp: Date.now(),
    tags,
  });

  return { result, metric };
}
