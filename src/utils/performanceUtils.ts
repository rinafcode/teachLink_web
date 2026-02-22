/**
 * Performance utilities for measuring and tracking Web Vitals and custom metrics.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  label?: string;
}

/**
 * Measures the Core Web Vitals and other performance metrics.
 * @param onReport Callback function to receive the performance metric.
 */
export const measureWebVitals = (onReport: (metric: PerformanceMetric) => void) => {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    onReport({ name: 'LCP', value: lastEntry.startTime, label: 'ms' });
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

  // FID (First Input Delay)
  const fidObserver = new PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      // Use type assertion for properties not in base PerformanceEntry
      const firstInputEntry = entry as PerformanceEntry & { processingStart?: number };
      if (firstInputEntry.processingStart) {
        onReport({ name: 'FID', value: firstInputEntry.processingStart - entry.startTime, label: 'ms' });
      }
    });
  });
  fidObserver.observe({ type: 'first-input', buffered: true });

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const layoutShiftEntry = entry as { hadRecentInput?: boolean; value?: number };
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value || 0;
        onReport({ name: 'CLS', value: clsValue });
      }
    }
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });

  // TTFB (Time to First Byte)
  window.addEventListener('load', () => {
    const [navEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntry) {
      onReport({ name: 'TTFB', value: navEntry.responseStart, label: 'ms' });
    }
  });
};

interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly saveData: boolean;
}

/**
 * Checks if the user's connection is "slow" to determine if prefetching should be disabled.
 */
export const isSlowConnection = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const nav = navigator as Navigator & { 
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  if (connection) {
    if (connection.saveData) return true;
    const effectiveType = connection.effectiveType;
    return ['slow-2g', '2g', '3g'].includes(effectiveType);
  }
  
  return false;
};

/**
 * Wraps a function to track its execution duration.
 */
export const trackDuration = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Async version of trackDuration.
 */
export const trackDurationAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
};
