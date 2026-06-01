import { useState, useEffect, useCallback } from 'react';

export interface AnalyticsDataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

export const useRealTimeAnalytics = (initialData: AnalyticsDataPoint[] = []) => {
  const [data, setData] = useState<AnalyticsDataPoint[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  // In a real application, this would connect to a real WebSocket endpoint
  // For the sake of this frontend implementation, we simulate the WebSocket stream
  useEffect(() => {
    // Simulate WebSocket connection
    setIsConnected(true);

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
      setIsConnected(false);
    };
  }, []);

  const addDataPoint = useCallback((point: AnalyticsDataPoint) => {
    setData((prev) => [...prev, point]);
  }, []);

  return { data, isConnected, addDataPoint };
};
