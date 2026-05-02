import React from 'react';
import type { PerformanceTrendPoint } from '@/utils/performanceUtils';

interface UXMonitoringProps {
  trend: PerformanceTrendPoint[];
}

export function UXMonitoring({ trend }: UXMonitoringProps) {
  // Group by metric name to show historical analysis
  const historyByMetric = trend.reduce((acc, point) => {
    if (!acc[point.name]) acc[point.name] = [];
    acc[point.name].push(point);
    return acc;
  }, {} as Record<string, PerformanceTrendPoint[]>);

  return (
    <div className="p-5 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Historical UX Trends</h2>
      {Object.keys(historyByMetric).length === 0 ? (
        <p className="text-gray-500 text-sm">No historical interaction data available yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(historyByMetric).map(([name, points]) => {
            const latest = points[points.length - 1];
            const avg = points.reduce((sum, p) => sum + p.value, 0) / points.length;
            
            return (
              <div key={name} className="flex justify-between items-center border-b pb-3 border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span>
                  <p className="text-xs text-gray-500 mt-1">Historic Avg: {avg.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{latest.value.toFixed(2)} <span className="font-normal text-xs text-gray-400">(Latest)</span></span>
                  <div className={`text-xs mt-1 capitalize ${latest.rating === 'good' ? 'text-green-600 dark:text-green-400' : latest.rating === 'needs-improvement' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {latest.rating?.replace('-', ' ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}