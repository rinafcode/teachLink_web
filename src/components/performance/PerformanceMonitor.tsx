'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { formatMetricValue } from '@/utils/performanceUtils';
import { CoreWebVitals } from './CoreWebVitals';

const showMonitorUi =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PERF_MONITOR_UI === 'true';

/**
 * Subscribes to Core Web Vitals app-wide (via layout). Optional compact overlay in dev / when enabled.
 */
const PerformanceMonitor: React.FC = () => {
  const { metrics } = usePerformanceMonitoring();

  const [expanded, setExpanded] = useState(false);

  if (!showMonitorUi) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-50 text-xs shadow-xl backdrop-blur-sm transition-all ${
        expanded ? 'w-[min(100vw-2rem,22rem)]' : 'w-auto'
      }`}
    >
      <div className="flex justify-between items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
        <span className="font-semibold">Performance</span>
        <div className="flex items-center gap-2">
          <Link
            href="/performance"
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {expanded ? 'Compact' : 'Expand'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="p-3 max-h-[70vh] overflow-y-auto">
          <CoreWebVitals metrics={metrics} />
        </div>
      ) : (
        <ul
          className="p-3 space-y-1 font-mono max-h-40 overflow-y-auto"
          aria-label="Latest performance metrics"
        >
          {Object.values(metrics).length === 0 ? (
            <li className="text-gray-500 dark:text-gray-400">Collecting vitals…</li>
          ) : (
            Object.values(metrics).map((metric) => (
              <li key={metric.name} className="flex justify-between gap-4">
                <span>{metric.name}</span>
                <span
                  className={
                    metric.rating === 'poor'
                      ? 'text-red-600 dark:text-red-400'
                      : metric.rating === 'needs-improvement'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                >
                  {formatMetricValue(metric)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default PerformanceMonitor;
