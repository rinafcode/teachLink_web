export type Metric = {
  name: string;
  value: number;
  timestamp: number;
};

export interface MonitoringProvider {
  getMetrics(): Promise<Metric[]>;
}

// Simple local provider (can swap with Datadog/New Relic later)
export class LocalMonitoringProvider implements MonitoringProvider {
  async getMetrics(): Promise<Metric[]> {
    const baseMetrics: Metric[] = [
      {
        name: 'response_time',
        value: Math.random() * 500,
        timestamp: Date.now(),
      },
      {
        name: 'error_rate',
        value: Math.random() * 5,
        timestamp: Date.now(),
      },
    ];

    try {
      const response = await fetch('/api/performance/db-metrics');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return [...baseMetrics, ...result.data];
      }
    } catch (error) {
      console.warn('[Monitoring] Failed to fetch DB metrics:', error);
    }

    return baseMetrics;
  }
}
