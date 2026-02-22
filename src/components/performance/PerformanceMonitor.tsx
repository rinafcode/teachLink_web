'use client';

import React, { useEffect, useState } from 'react';
import { measureWebVitals, PerformanceMetric } from '../../utils/performanceUtils';

/**
 * Component to monitor and display performance metrics in real-time.
 * In a production environment, this could be hidden or restricted to admin users.
 */
const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, PerformanceMetric>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    measureWebVitals((metric) => {
      setMetrics((prev: Record<string, PerformanceMetric>) => ({
        ...prev,
        [metric.name]: metric,
      }));

      // Logic for alerts based on thresholds
      if (metric.name === 'LCP' && metric.value > 2500) {
        console.warn(`[Performance Alert] LCP is high: ${metric.value.toFixed(2)}ms`);
      }
      if (metric.name === 'FID' && metric.value > 100) {
        console.warn(`[Performance Alert] FID is high: ${metric.value.toFixed(2)}ms`);
      }
    });
  }, []);

  if (process.env.NODE_ENV === 'production' && !isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-black/80 text-white text-xs font-mono shadow-xl transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
      <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-1">
        <span className="font-bold ">🚀 Performance Monitor</span>
        <button onClick={() => setIsVisible(!isVisible)} className="ml-2 hover:text-blue-400">
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="space-y-1">
        {Object.values(metrics).map((metric) => (
          <div key={metric.name} className="flex justify-between gap-4">
            <span>{metric.name}:</span>
            <span className={metric.value > 2000 ? 'text-red-400' : 'text-green-400'}>
              {metric.value.toFixed(2)}{metric.label || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
