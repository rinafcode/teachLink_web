/**
 * RealTimeUpdater Component
 * Live data stream panel for the Advanced Data Visualization Dashboard.
 * Uses the existing useDataVisualization hook for WebSocket + simulation support.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Activity, Pause, Play, RefreshCw } from 'lucide-react';
import { InteractiveChartLibrary } from '@/components/visualization/InteractiveChartLibrary';
import { useDataVisualization } from '@/hooks/useDataVisualization';
import type { ChartType } from '@/utils/visualizationUtils';
import { useInternationalization } from '@/hooks/useInternationalization';
import { translateWithFallback } from './dashboardI18n';

export interface RealTimeUpdaterProps {
  title?: string;
  chartType?: ChartType;
  websocketUrl?: string;
  updateInterval?: number;
  maxDataPoints?: number;
  className?: string;
}

const SPEED_OPTIONS = [
  { label: '0.5s', value: 500 },
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
];

export const RealTimeUpdater = React.memo<RealTimeUpdaterProps>(
  ({
    title,
    chartType = 'line',
    websocketUrl,
    updateInterval: initialInterval = 2000,
    maxDataPoints = 20,
    className = '',
  }) => {
    const { language, t, formatNumber, formatPercentage } = useInternationalization();
    const [isPaused, setIsPaused] = useState(false);
    const [interval, setIntervalValue] = useState(initialInterval);
    const simulationEnabled = !websocketUrl;
    const resolvedTitle =
      title ??
      translateWithFallback(t, 'dashboard.analytics.panels.realtime.title', 'Live Activity');
    const liveDataLabel = translateWithFallback(
      t,
      'dashboard.analytics.datasets.realtime',
      'Live Data',
    );

    const {
      data,
      isConnected,
      isLoading,
      error,
      updateData,
      addDataPoint,
      config,
      calculateStats,
    } = useDataVisualization({
      initialData: {
        labels: [],
        datasets: [
          {
            label: liveDataLabel,
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 2,
          },
        ],
      },
      config: {
        chartType,
        realTimeEnabled: !!websocketUrl,
        animated: true,
        showLegend: true,
        showGrid: true,
      },
      websocketUrl,
    });

    useEffect(() => {
      if (!simulationEnabled || isPaused) return;

      const timer = setInterval(() => {
        const timeLabel = new Date().toLocaleTimeString(language);
        const value = Math.floor(Math.random() * 100);
        addDataPoint(0, value, timeLabel);

        if (data && data.labels.length > maxDataPoints) {
          updateData({
            labels: data.labels.slice(-maxDataPoints),
            datasets: data.datasets.map((dataset) => ({
              ...dataset,
              data: dataset.data.slice(-maxDataPoints),
            })),
          });
        }
      }, interval);

      return () => clearInterval(timer);
    }, [
      addDataPoint,
      data,
      interval,
      isPaused,
      language,
      maxDataPoints,
      simulationEnabled,
      updateData,
    ]);

    const stats = calculateStats();
    const statusKey = isPaused
      ? 'paused'
      : isConnected
      ? 'connected'
      : simulationEnabled
      ? 'simulating'
      : 'disconnected';

    const statusColor = isPaused
      ? 'text-yellow-600 dark:text-yellow-400'
      : isConnected || simulationEnabled
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

    const handleReset = useCallback(() => {
      updateData({
        labels: [],
        datasets: [
          {
            label: liveDataLabel,
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 2,
          },
        ],
      });
    }, [liveDataLabel, updateData]);

    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {(isConnected || simulationEnabled) && !isPaused ? (
                <Wifi className="w-4 h-4 text-green-500" aria-hidden="true" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" aria-hidden="true" />
              )}
              <span className={`text-sm font-medium ${statusColor}`}>
                {translateWithFallback(
                  t,
                  `dashboard.analytics.realtime.status.${statusKey}`,
                  statusKey,
                )}
              </span>
            </div>

            {data && data.labels.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span>
                  {translateWithFallback(
                    t,
                    'dashboard.analytics.realtime.pointsCount',
                    `${formatNumber(data.labels.length)} pts`,
                    { count: formatNumber(data.labels.length) },
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="rt-speed" className="sr-only">
              {translateWithFallback(t, 'dashboard.analytics.realtime.updateSpeed', 'Update speed')}
            </label>
            <select
              id="rt-speed"
              value={interval}
              onChange={(event) => setIntervalValue(Number(event.target.value))}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label={translateWithFallback(
                t,
                'dashboard.analytics.realtime.updateSpeed',
                'Update speed',
              )}
            >
              {SPEED_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsPaused((value) => !value)}
              aria-label={translateWithFallback(
                t,
                isPaused
                  ? 'dashboard.analytics.realtime.resume'
                  : 'dashboard.analytics.realtime.pause',
                isPaused ? 'Resume live updates' : 'Pause live updates',
              )}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isPaused ? (
                <Play className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Pause className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={handleReset}
              aria-label={translateWithFallback(
                t,
                'dashboard.analytics.realtime.reset',
                'Reset data',
              )}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {translateWithFallback(t, 'dashboard.analytics.realtime.stats.mean', 'Mean')}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(stats.mean, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {translateWithFallback(t, 'dashboard.analytics.realtime.stats.median', 'Median')}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(stats.median, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {translateWithFallback(t, 'dashboard.analytics.realtime.stats.trend', 'Trend')}
              </div>
              <div
                className={`text-lg font-semibold ${
                  stats.trend.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : stats.trend.direction === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {translateWithFallback(
                  t,
                  `dashboard.analytics.realtime.trendDirections.${stats.trend.direction}`,
                  stats.trend.direction,
                )}{' '}
                {formatPercentage(stats.trend.percentage, 1)}
              </div>
            </div>
          </div>
        )}

        {data && data.labels.length > 0 ? (
          <InteractiveChartLibrary
            data={data}
            chartType={chartType}
            title={resolvedTitle}
            height={280}
            showLegend={config.showLegend}
            showGrid={config.showGrid}
            animated={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <Activity className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
            <p className="text-sm">
              {isLoading
                ? translateWithFallback(
                    t,
                    'dashboard.analytics.realtime.loadingData',
                    'Loading data...',
                  )
                : translateWithFallback(
                    t,
                    'dashboard.analytics.realtime.waitingForData',
                    'Waiting for data...',
                  )}
            </p>
          </div>
        )}
      </div>
    );
  },
);

RealTimeUpdater.displayName = 'RealTimeUpdater';
