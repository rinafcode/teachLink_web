import React from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { UXMonitoring } from './UXMonitoring';
import { OptimizationRecommendations } from './OptimizationRecommendations';
import { AlertManager } from './AlertManager';

export function PerformanceDashboard() {
  const { metrics, trend } = usePerformanceMonitoring();

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Performance Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.values(metrics).map((metric) => (
          <div key={metric.name} className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{metric.name}</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {metric.value.toFixed(2)} <span className="text-lg font-normal text-gray-500">{metric.label}</span>
            </p>
            <span className={`inline-block mt-3 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide
              ${metric.rating === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : metric.rating === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
              {metric.rating || 'Analyzing...'}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UXMonitoring trend={trend} />
        <AlertManager />
      </div>
      
      <div className="mt-8">
        <OptimizationRecommendations />
      </div>
    </div>
  );
}