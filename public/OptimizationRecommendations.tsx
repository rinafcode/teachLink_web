import React from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export function OptimizationRecommendations() {
  const { suggestions } = usePerformanceMonitoring();

  return (
    <div className="p-5 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Optimization Recommendations</h2>
      
      {suggestions.length === 0 ? (
        <div className="p-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/30">
          <p className="font-medium">All good!</p>
          <p className="text-sm mt-1">No major performance or optimization issues detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800/50">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">{suggestion.title}</h3>
                <span className="text-[10px] px-2 py-1 uppercase rounded bg-yellow-200 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-100 font-bold">
                  {suggestion.impact} Impact
                </span>
              </div>
              <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300/80 leading-relaxed">
                {suggestion.detail}
              </p>
              {suggestion.metric && (
                <span className="inline-block mt-3 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400 rounded">
                  Related Metric: {suggestion.metric}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}