import { useState, useEffect, useCallback } from 'react';
import {
  ConnectionSupervisor,
  LocalRealtimeTransport,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';
import { useRealtimeConnection } from './useRealtimeConnection';

export interface AnalyticsDataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

const ANALYTICS_CONNECTION = 'real-time-analytics';

export const useRealTimeAnalytics = (initialData: AnalyticsDataPoint[] = []) => {
  const [data, setData] = useState<AnalyticsDataPoint[]>(initialData);
  const connection = useRealtimeConnection(ANALYTICS_CONNECTION);

  // The analytics stream is simulated client-side; the supervisor is registered
  // with a locally-open transport so consumers observe the same unified
  // connection status shape as every other realtime hook.
  useEffect(() => {
    const transport = new LocalRealtimeTransport();
    const supervisor = new ConnectionSupervisor(transport, { manageReconnect: false });
    const unregister = registerSupervisor(ANALYTICS_CONNECTION, supervisor);
    supervisor.connect();

    const interval = setInterval(() => {
      setData((prevData) => {
        const newDataPoint: AnalyticsDataPoint = {
          timestamp: new Date().toISOString(),
          value: Math.floor(Math.random() * 100) + 10,
          category: ['engagement', 'learning', 'performance'][Math.floor(Math.random() * 3)],
        };

        // Keep the last 50 points to avoid memory issues while demonstrating streaming
        const updatedData = [...prevData, newDataPoint];
        return updatedData.length > 50 ? updatedData.slice(updatedData.length - 50) : updatedData;
      });
    }, 2000); // 2 seconds update as per requirements

    return () => {
      clearInterval(interval);
      unregister();
      supervisor.disconnect();
    };
  }, []);

  const addDataPoint = useCallback((point: AnalyticsDataPoint) => {
    setData((prev) => [...prev, point]);
  }, []);

  return { data, isConnected: connection.isConnected, connection, addDataPoint };
};
