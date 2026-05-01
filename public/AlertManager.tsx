import React from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export function AlertManager() {
  const { alerts, clearAlerts } = usePerformanceMonitoring();

  return (
    <div className="p-5 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Active Alerts</h2>
        {alerts.length > 0 && (
          <button 
            onClick={clearAlerts}
            className="text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-500 text-sm">No active alerts at the moment.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {alerts.map((alert, idx) => (
            <div 
              key={`${alert.id}-${idx}`} 
              className={`p-3 rounded-lg border ${
                alert.severity === 'critical' 
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800/50 dark:text-red-300' 
                  : 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/10 dark:border-orange-800/50 dark:text-orange-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <strong className="text-sm">{alert.metricName} Issue</strong>
                <span className="text-xs opacity-75">{new Date(alert.at).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm opacity-90">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}