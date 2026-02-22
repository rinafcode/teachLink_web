'use client';

import { useEffect, useRef } from 'react';

interface UsePerformanceOptions {
  componentName: string;
  threshold?: number; // threshold in ms for performance alerts
}

/**
 * Hook to monitor component render performance and identify potential bottlenecks.
 */
export const usePerformanceOptimization = ({ componentName, threshold = 16 }: UsePerformanceOptions) => {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    if (duration > threshold) {
      console.warn(`[Performance Warning] Component "${componentName}" took ${duration.toFixed(2)}ms to mount. Threshold is ${threshold}ms.`);
    }

    // Capture render count for optimization analysis
    // In a real scenario, this could be sent to a tracking service
  }, [componentName, threshold]);

  // Utility to track interaction performance within the component
  const trackInteraction = (actionName: string, action: () => void) => {
    const start = performance.now();
    action();
    const end = performance.now();
    const duration = end - start;
    if (duration > threshold) {
      console.warn(`[Performance Warning] Interaction "${actionName}" in "${componentName}" took ${duration.toFixed(2)}ms.`);
    }
  };

  return { trackInteraction };
};
