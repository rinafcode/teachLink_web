/**
 * useDataVisualization Hook
 * Manages data visualization state, real-time updates, and chart interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import {
  ChartData,
  ChartType,
  TimeRange,
  AggregationType,
  aggregateByTimePeriod,
  calculateMovingAverage,
  calculateTrend,
  exportToCSV,
  exportToJSON,
} from '@/utils/visualizationUtils';

export interface VisualizationConfig {
  chartType: ChartType;
  timeRange: TimeRange;
  aggregation: AggregationType;
  showLegend: boolean;
  showGrid: boolean;
  animated: boolean;
  realTimeEnabled: boolean;
}

export interface UseDataVisualizationOptions {
  initialData?: ChartData;
  config?: Partial<VisualizationConfig>;
  websocketUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseDataVisualizationReturn {
  data: ChartData | null;
  config: VisualizationConfig;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  updateData: (newData: ChartData) => void;
  updateConfig: (newConfig: Partial<VisualizationConfig>) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'json', filename: string) => void;
  addDataPoint: (datasetIndex: number, value: number, label?: string) => void;
  removeDataPoint: (datasetIndex: number, index: number) => void;
  clearData: () => void;
  calculateStats: () => {
    mean: number;
    median: number;
    trend: { direction: 'up' | 'down' | 'neutral'; percentage: number };
  } | null;
}

const defaultConfig: VisualizationConfig = {
  chartType: 'line',
  timeRange: '7d',
  aggregation: 'sum',
  showLegend: true,
  showGrid: true,
  animated: true,
  realTimeEnabled: false,
};

export const useDataVisualization = (
  options: UseDataVisualizationOptions = {},
): UseDataVisualizationReturn => {
  const {
    initialData = null,
    config: initialConfig = {},
    websocketUrl,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [data, setData] = useState<ChartData | null>(initialData);
  const [config, setConfig] = useState<VisualizationConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize WebSocket connection for real-time updates
   */
  useEffect(() => {
    if (!websocketUrl || !config.realTimeEnabled) {
      return undefined;
    }

    let socket: Socket | null = null;
    try {
      socket = io(websocketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('data-update', (newData: ChartData) => {
        setData(newData);
      });

      socket.on('data-point', ({ datasetIndex, value, label }) => {
        setData((prevData) => {
          if (!prevData) return prevData;

          const newData = { ...prevData };
          if (label) {
            newData.labels.push(label);
          }
          newData.datasets[datasetIndex].data.push(value);

          // Keep only last 50 points for performance
          if (newData.labels.length > 50) {
            newData.labels.shift();
            newData.datasets.forEach((dataset) => dataset.data.shift());
          }

          return newData;
        });
      });

      socket.on('error', (err: Error) => {
        setError(err.message);
      });

      socketRef.current = socket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'WebSocket connection failed');
      return undefined;
    }

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [websocketUrl, config.realTimeEnabled]);

  /**
   * Refresh data (placeholder for API call)
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual data fetching
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In real implementation, fetch data from API
      // const response = await fetch('/api/analytics/data');
      // const newData = await response.json();
      // setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-refresh data at specified interval
   */
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  /**
   * Update chart data
   */
  const updateData = useCallback((newData: ChartData) => {
    setData(newData);
    setError(null);
  }, []);

  /**
   * Update visualization configuration
   */
  const updateConfig = useCallback((newConfig: Partial<VisualizationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Export data to file
   */
  const exportData = useCallback(
    (format: 'csv' | 'json', filename: string) => {
      if (!data) {
        setError('No data to export');
        return;
      }

      try {
        if (format === 'csv') {
          exportToCSV(data, filename);
        } else {
          exportToJSON(data, filename);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    },
    [data],
  );

  /**
   * Add a new data point
   */
  const addDataPoint = useCallback((datasetIndex: number, value: number, label?: string) => {
    setData((prevData) => {
      if (!prevData) return prevData;

      const newData = { ...prevData };

      if (label && !newData.labels.includes(label)) {
        newData.labels.push(label);
      }

      if (newData.datasets[datasetIndex]) {
        newData.datasets[datasetIndex].data.push(value);
      }

      return newData;
    });
  }, []);

  /**
   * Remove a data point
   */
  const removeDataPoint = useCallback((datasetIndex: number, index: number) => {
    setData((prevData) => {
      if (!prevData) return prevData;

      const newData = { ...prevData };
      newData.labels.splice(index, 1);
      newData.datasets[datasetIndex].data.splice(index, 1);

      return newData;
    });
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  /**
   * Calculate statistics for current data
   */
  const calculateStats = useCallback(() => {
    if (!data || data.datasets.length === 0) {
      return null;
    }

    const firstDataset = data.datasets[0].data;
    const sum = firstDataset.reduce((a, b) => a + b, 0);
    const mean = sum / firstDataset.length;

    const sorted = [...firstDataset].sort((a, b) => a - b);
    const median =
      firstDataset.length % 2 === 0
        ? (sorted[firstDataset.length / 2 - 1] + sorted[firstDataset.length / 2]) / 2
        : sorted[Math.floor(firstDataset.length / 2)];

    const trend = calculateTrend(firstDataset);

    return { mean, median, trend };
  }, [data]);

  return {
    data,
    config,
    isLoading,
    error,
    isConnected,
    updateData,
    updateConfig,
    refreshData,
    exportData,
    addDataPoint,
    removeDataPoint,
    clearData,
    calculateStats,
  };
};