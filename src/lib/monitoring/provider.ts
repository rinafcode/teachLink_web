import { getRecordedMetrics } from '@/lib/logging/performance';
import { createLogger } from '@/lib/logging';

const logger = createLogger('monitoring-provider');

export type Metric = {
  name: string;
  value: number;
  timestamp: number;
  unit?: string;
  tags?: Record<string, string | number | boolean>;
};

export interface MonitoringProvider {
  getMetrics(): Promise<Metric[]>;
}

export class LocalMonitoringProvider implements MonitoringProvider {
  async getMetrics(): Promise<Metric[]> {
    const baseMetrics: Metric[] = getRecordedMetrics(20).map((metric) => ({
      name: metric.name,
      value: metric.value,
      timestamp: metric.timestamp,
      unit: metric.unit,
      tags: metric.tags,
    }));

    try {
      const response = await fetch('/api/performance/db-metrics');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        return [...baseMetrics, ...result.data];
      }
    } catch (error) {
      logger.warn('[Monitoring] Failed to fetch DB metrics', { error });
    }

    return baseMetrics;
  }
}
