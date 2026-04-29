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
    return [
      {
        name: "response_time",
        value: Math.random() * 500,
        timestamp: Date.now(),
      },
      {
        name: "error_rate",
        value: Math.random() * 5,
        timestamp: Date.now(),
      },
    ];
  }
}