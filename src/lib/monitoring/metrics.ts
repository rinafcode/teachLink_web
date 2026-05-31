import { useEffect, useState } from 'react';
import { LocalMonitoringProvider, Metric } from './provider';

const provider = new LocalMonitoringProvider();

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
