/**
 * RealTimeDataVisualizer Component
 * Live data visualization with WebSocket updates
 */

'use client';

import React, { useEffect, useState } from 'react';
import { InteractiveChartLibrary } from './InteractiveChartLibrary';
import { useDataVisualization } from '@/hooks/useDataVisualization';
import { ChartData, ChartType, generateSampleData } from '@/utils/visualizationUtils';
import { Activity, Wifi, WifiOff, RefreshCw, Pause, Play } from 'lucide-react';

export interface RealTimeDataVisualizerProps {
  websocketUrl?: string;
  chartType?: ChartType;
  title?: string;
  updateInterval?: number;
  maxDataPoints?: number;
  className?: string;
}

export const RealTimeDataVisualizer: React.FC<RealTimeDataVisualizerProps> = ({
  websocketUrl,
  chartType = 'line',
  title = 'Real-Time Data',
  updateInterval = 2000,
  maxDataPoints = 20,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(!websocketUrl);

  const {
    data,
    isConnected,
    isLoading,
    error,
    updateData,
    addDataPoint,
    config,
    updateConfig,
    calculateStats,
  } = useDataVisualization({
    initialData: {
      labels: [],
      datasets: [
        {
          label: 'Real-Time Data',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    },
    config: {
      chartType,
      realTimeEnabled: true,
      animated: true,
      showLegend: true,
      showGrid: true,
    },
    websocketUrl,
  });

  // Simulate real-time data updates when WebSocket is not available
  useEffect(() => {
    if (!simulationEnabled || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString();
      const value = Math.floor(Math.random() * 100);

      addDataPoint(0, value, timeLabel);

      // Keep only the last maxDataPoints
      if (data && data.labels.length > maxDataPoints) {
        updateData({
          labels: data.labels.slice(-maxDataPoints),
          datasets: data.datasets.map((dataset) => ({
            ...dataset,
            data: dataset.data.slice(-maxDataPoints),
          })),
        });
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [simulationEnabled, isPaused, updateInterval, maxDataPoints, addDataPoint, data, updateData]);

  const stats = calculateStats();

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRefresh = () => {
    updateData({
      labels: [],
      datasets: [
        {
          label: 'Real-Time Data',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected || simulationEnabled ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {isConnected ? 'Connected' : 'Simulating'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Disconnected
                  </span>
                </>
              )}
            </div>

            {data && data.labels.length > 0 && (
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {data.labels.length} data points
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={togglePause}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Pause className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">Error: {error}</div>}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Mean</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.mean.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Median</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.median.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
            <div className="flex items-center space-x-2">
              <div
                className={`text-2xl font-bold ${
                  stats.trend.direction === 'up'
                    ? 'text-green-600'
                    : stats.trend.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stats.trend.direction === 'up'
                  ? '↑'
                  : stats.trend.direction === 'down'
                  ? '↓'
                  : '→'}
                {stats.trend.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {data && data.labels.length > 0 ? (
        <InteractiveChartLibrary
          data={data}
          chartType={chartType}
          title={title}
          height={400}
          showLegend={config.showLegend}
          showGrid={config.showGrid}
          animated={config.animated}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading data...' : 'Waiting for data...'}
          </p>
        </div>
      )}
    </div>
  );
};
