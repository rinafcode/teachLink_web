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

    if (m.name === 'zoom_api_latency' && m.value > 600) {
      alerts.push({
        message: 'High Zoom API latency detected',
        severity: 'low',
      });
    }

    if (m.name === 'zoom_api_error_rate' && m.value > 4) {
      alerts.push({
        message: 'Zoom API error rate is above threshold',
        severity: 'high',
      });
    }

    if (m.name === 'zoom_packet_loss' && m.value > 3) {
      alerts.push({
        message: 'High packet loss in Zoom session detected',
        severity: 'high',
      });
    }

    if (m.name === 'zoom_sdk_load_time' && m.value > 2500) {
      alerts.push({
        message: 'Zoom Web SDK load time is slow',
        severity: 'low',
      });
    }

    if (m.name === 'zoom_connection_jitter' && m.value > 30) {
      alerts.push({
        message: 'High connection jitter in Zoom session detected',
        severity: 'low',
      });
    }
  });

  return alerts;
}
