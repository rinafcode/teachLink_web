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
  calculateTrend,
  exportToCSV,
  exportToJSON,
} from '@/utils/visualizationUtils';
import { useAnalyticsErrorTracking } from './useAnalyticsErrorTracking';
import type {
  AnalyticsErrorType,
  TrackedError,
  AnalyticsErrorContext,
} from './useAnalyticsErrorTracking';

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
  error: string | null; // Legacy support - will be removed in future versions
  errors: TrackedError[];
  hasErrors: boolean;
  latestError: TrackedError | null;
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
  trackError: (
    type: AnalyticsErrorType,
    message: string,
    additionalContext?: Partial<AnalyticsErrorContext>,
    error?: Error,
  ) => void;
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

  // Initialize error tracking
  const { trackError, errors, hasErrors, getLatestError } = useAnalyticsErrorTracking({
    componentName: 'useDataVisualization',
    websocketUrl,
  });

  const [data, setData] = useState<ChartData | null>(initialData);
  const [config, setConfig] = useState<VisualizationConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(false);
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
        trackError('WEBSOCKET_CONNECTION_ERROR', err.message, { metadata: { websocketUrl } }, err);
      });

      socketRef.current = socket;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'WebSocket connection failed';
      trackError(
        'WEBSOCKET_CONNECTION_ERROR',
        errorMessage,
        { metadata: { websocketUrl } },
        err instanceof Error ? err : undefined,
      );
      return undefined;
    }

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [websocketUrl, config.realTimeEnabled, trackError]);

  /**
   * Refresh data (placeholder for API call)
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual data fetching
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In real implementation, fetch data from API
      // const response = await fetch('/api/analytics/data');
      // if (!response.ok) throw new Error('Failed to fetch analytics data');
      // const newData = await response.json();
      // setData(newData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      trackError(
        'DATA_FETCH_ERROR',
        errorMessage,
        {
          timeRange: config.timeRange,
          aggregation: config.aggregation,
          metadata: { autoRefresh, refreshInterval },
        },
        err instanceof Error ? err : undefined,
      );
    } finally {
      setIsLoading(false);
    }
  }, [config.timeRange, config.aggregation, autoRefresh, refreshInterval, trackError]);

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
  const updateData = useCallback(
    (newData: ChartData) => {
      try {
        setData(newData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update chart data';
        trackError(
          'DATA_PROCESSING_ERROR',
          errorMessage,
          {},
          err instanceof Error ? err : undefined,
        );
      }
    },
    [trackError],
  );

  /**
   * Update visualization configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<VisualizationConfig>) => {
      try {
        setConfig((prev) => ({ ...prev, ...newConfig }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update visualization config';
        trackError(
          'FILTER_APPLICATION_ERROR',
          errorMessage,
          { metadata: { newConfig } },
          err instanceof Error ? err : undefined,
        );
      }
    },
    [trackError],
  );

  /**
   * Export data to file
   */
  const exportData = useCallback(
    (format: 'csv' | 'json', filename: string) => {
      if (!data) {
        trackError('EXPORT_ERROR', 'No data available to export');
        return;
      }

      try {
        if (format === 'csv') {
          exportToCSV(data, filename);
        } else {
          exportToJSON(data, filename);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Export failed';
        trackError(
          'EXPORT_ERROR',
          errorMessage,
          { metadata: { format, filename } },
          err instanceof Error ? err : undefined,
        );
      }
    },
    [data, trackError],
  );

  /**
   * Add a new data point
   */
  const addDataPoint = useCallback(
    (datasetIndex: number, value: number, label?: string) => {
      try {
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add data point';
        trackError(
          'REAL_TIME_SYNC_ERROR',
          errorMessage,
          { metadata: { datasetIndex, value, label } },
          err instanceof Error ? err : undefined,
        );
      }
    },
    [trackError],
  );

  /**
   * Remove a data point
   */
  const removeDataPoint = useCallback(
    (datasetIndex: number, index: number) => {
      try {
        setData((prevData) => {
          if (!prevData) return prevData;

          const newData = { ...prevData };
          newData.labels.splice(index, 1);
          newData.datasets[datasetIndex].data.splice(index, 1);

          return newData;
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove data point';
        trackError(
          'DATA_PROCESSING_ERROR',
          errorMessage,
          { metadata: { datasetIndex, index } },
          err instanceof Error ? err : undefined,
        );
      }
    },
    [trackError],
  );

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setData(null);
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

  // For legacy compatibility, set the simple error string to the latest error message
  const latestError = getLatestError();
  const legacyError = latestError ? latestError.message : null;

  return {
    data,
    config,
    isLoading,
    error: legacyError, // Legacy support
    errors,
    hasErrors,
    latestError,
    isConnected,
    updateData,
    updateConfig,
    refreshData,
    exportData,
    addDataPoint,
    removeDataPoint,
    clearData,
    calculateStats,
    trackError,
  };
};
