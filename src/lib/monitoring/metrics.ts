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

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // real-time updates

    return () => clearInterval(interval);
  }, []);

  return metrics;
}
