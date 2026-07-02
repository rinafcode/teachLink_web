import { getRecordedMetrics } from '@/lib/logging/performance';

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

    const metricsList = [...baseMetrics];

    try {
      const response = await fetch('/api/performance/db-metrics');

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          metricsList.push(...result.data);
        }
      } else {
        console.warn(`[Monitoring] DB metrics response error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('[Monitoring] Failed to fetch DB metrics:', error);
    }

    try {
      const response = await fetch('/api/performance/zoom-metrics');

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          metricsList.push(...result.data);
        }
      } else {
        console.warn(`[Monitoring] Zoom metrics response error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('[Monitoring] Failed to fetch Zoom metrics:', error);
    }

    return metricsList;
  }
}
