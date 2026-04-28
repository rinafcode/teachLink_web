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
    return getRecordedMetrics(20).map((metric) => ({
      name: metric.name,
      value: metric.value,
      timestamp: metric.timestamp,
      unit: metric.unit,
      tags: metric.tags,
    }));
  }
}
