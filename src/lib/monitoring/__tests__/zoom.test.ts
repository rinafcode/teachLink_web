import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAlerts } from '../alerts';
import { LocalMonitoringProvider, Metric } from '../provider';

describe('Zoom Performance Monitoring Alerts', () => {
  it('should not return alerts when Zoom metrics are within healthy limits', () => {
    const metrics: Metric[] = [
      { name: 'zoom_api_latency', value: 300, timestamp: Date.now() },
      { name: 'zoom_api_error_rate', value: 1.5, timestamp: Date.now() },
      { name: 'zoom_packet_loss', value: 0.8, timestamp: Date.now() },
      { name: 'zoom_sdk_load_time', value: 1200, timestamp: Date.now() },
      { name: 'zoom_connection_jitter', value: 10, timestamp: Date.now() },
    ];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(0);
  });

  it('should trigger alert when zoom_api_latency exceeds threshold', () => {
    const metrics: Metric[] = [{ name: 'zoom_api_latency', value: 650, timestamp: Date.now() }];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('High Zoom API latency');
    expect(alerts[0].severity).toBe('low');
  });

  it('should trigger alert when zoom_api_error_rate exceeds threshold', () => {
    const metrics: Metric[] = [{ name: 'zoom_api_error_rate', value: 4.5, timestamp: Date.now() }];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('Zoom API error rate is above threshold');
    expect(alerts[0].severity).toBe('high');
  });

  it('should trigger alert when zoom_packet_loss exceeds threshold', () => {
    const metrics: Metric[] = [{ name: 'zoom_packet_loss', value: 3.2, timestamp: Date.now() }];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('High packet loss in Zoom session detected');
    expect(alerts[0].severity).toBe('high');
  });

  it('should trigger alert when zoom_sdk_load_time exceeds threshold', () => {
    const metrics: Metric[] = [{ name: 'zoom_sdk_load_time', value: 2600, timestamp: Date.now() }];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('Zoom Web SDK load time is slow');
    expect(alerts[0].severity).toBe('low');
  });

  it('should trigger alert when zoom_connection_jitter exceeds threshold', () => {
    const metrics: Metric[] = [
      { name: 'zoom_connection_jitter', value: 35, timestamp: Date.now() },
    ];

    const alerts = checkAlerts(metrics);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('High connection jitter in Zoom session detected');
    expect(alerts[0].severity).toBe('low');
  });
});

describe('LocalMonitoringProvider with Zoom Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully fetch Zoom metrics and aggregate them', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/api/performance/db-metrics') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: [{ name: 'db_pool_total_connections', value: 5, timestamp: 123 }],
            }),
        } as Response);
      }
      if (url === '/api/performance/zoom-metrics') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: [{ name: 'zoom_api_latency', value: 150, timestamp: 456 }],
            }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const provider = new LocalMonitoringProvider();
    const metrics = await provider.getMetrics();

    expect(mockFetch).toHaveBeenCalledWith('/api/performance/db-metrics');
    expect(mockFetch).toHaveBeenCalledWith('/api/performance/zoom-metrics');

    const dbMetric = metrics.find((m) => m.name === 'db_pool_total_connections');
    const zoomMetric = metrics.find((m) => m.name === 'zoom_api_latency');

    expect(dbMetric).toBeDefined();
    expect(dbMetric?.value).toBe(5);
    expect(zoomMetric).toBeDefined();
    expect(zoomMetric?.value).toBe(150);
  });

  it('should handle fetch failures gracefully without crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/api/performance/db-metrics') {
        return Promise.resolve({
          ok: false,
          status: 500,
        } as Response);
      }
      if (url === '/api/performance/zoom-metrics') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const provider = new LocalMonitoringProvider();
    const metrics = await provider.getMetrics();
    expect(metrics).toBeDefined();
  });
});
