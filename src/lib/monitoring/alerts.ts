import { Metric } from './provider';

export type Alert = {
  message: string;
  severity: 'low' | 'high';
};

export function checkAlerts(metrics: Metric[]): Alert[] {
  const alerts: Alert[] = [];

  metrics.forEach((m) => {
    if (m.name === 'response_time' && m.value > 400) {
      alerts.push({
        message: 'High response time detected',
        severity: 'high',
      });
    }

    if (m.name === 'error_rate' && m.value > 3) {
      alerts.push({
        message: 'Error rate is above threshold',
        severity: 'high',
      });
    }
  });

  return alerts;
}
