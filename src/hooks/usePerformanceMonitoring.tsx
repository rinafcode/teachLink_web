'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import {
  appendTrendPoint,
  buildOptimizationSuggestions,
  evaluatePerformanceDegradation,
  loadTrendHistory,
  type PerformanceAlert,
  type PerformanceMetric,
  type PerformanceTrendPoint,
  subscribeCoreWebVitals,
} from '@/utils/performanceUtils';

export interface UsePerformanceMonitoringOptions {
  enableTrendRecording?: boolean;
  enableToasts?: boolean;
  onMetric?: (metric: PerformanceMetric) => void;
}

export interface UsePerformanceMonitoringResult {
  metrics: Record<string, PerformanceMetric>;
  alerts: PerformanceAlert[];
  suggestions: ReturnType<typeof buildOptimizationSuggestions>;
  trend: PerformanceTrendPoint[];
  clearAlerts: () => void;
  refreshTrendFromStorage: () => void;
}

const PerformanceMonitoringContext = createContext<UsePerformanceMonitoringResult | null>(null);

function usePerformanceMonitoringState(
  options: UsePerformanceMonitoringOptions = {},
): UsePerformanceMonitoringResult {
  const { enableTrendRecording = true, enableToasts = false, onMetric } = options;

  const [metrics, setMetrics] = useState<Record<string, PerformanceMetric>>({});
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [trend, setTrend] = useState<PerformanceTrendPoint[]>(() =>
    typeof window !== 'undefined' ? loadTrendHistory() : [],
  );

  const onMetricRef = useRef(onMetric);
  onMetricRef.current = onMetric;

  const toastDedupeRef = useRef(new Set<string>());

  const refreshTrendFromStorage = useCallback(() => {
    setTrend(loadTrendHistory());
  }, []);

  useEffect(() => {
    const unsub = subscribeCoreWebVitals((metric) => {
      setMetrics((prev) => ({ ...prev, [metric.name]: metric }));
      onMetricRef.current?.(metric);

      if (enableTrendRecording) {
        const point: PerformanceTrendPoint = {
          t: Date.now(),
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
        };
        appendTrendPoint(point);
        setTrend(loadTrendHistory());
      }

      const d = toastDedupeRef.current;
      if (metric.rating === 'good') {
        d.delete(`${metric.name}:needs-improvement`);
        d.delete(`${metric.name}:poor`);
        return;
      }

      const alert = evaluatePerformanceDegradation(metric);
      if (!alert) return;

      const toastKey = `${metric.name}:${metric.rating}`;
      if (!d.has(toastKey)) {
        d.add(toastKey);
        setAlerts((prev) => [...prev.slice(-49), alert]);
        console.warn(`[Performance] ${alert.message}`);
        if (enableToasts) {
          const toastOpts = { id: toastKey, duration: 6000 };
          if (metric.rating === 'poor') {
            toast.error(alert.message, toastOpts);
          } else {
            toast(alert.message, toastOpts);
          }
        }
      }
    });

    return unsub;
  }, [enableTrendRecording, enableToasts]);

  const suggestions = useMemo(() => buildOptimizationSuggestions(metrics), [metrics]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    toastDedupeRef.current.clear();
  }, []);

  return {
    metrics,
    alerts,
    suggestions,
    trend,
    clearAlerts,
    refreshTrendFromStorage,
  };
}

const providerEnableToasts =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_PERF_ALERTS === 'true' ||
  process.env.NEXT_PUBLIC_ENABLE_PERF_DASHBOARD === 'true';

/**
 * Single app-wide subscriber; wrap the tree near the root (e.g. in `layout.tsx`).
 */
export function PerformanceMonitoringProvider({ children }: { children: React.ReactNode }) {
  const value = usePerformanceMonitoringState({
    enableToasts: providerEnableToasts,
    enableTrendRecording: true,
  });

  return (
    <PerformanceMonitoringContext.Provider value={value}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
}

/**
 * Access metrics, alerts, suggestions, and trends from the provider.
 */
export function usePerformanceMonitoring(): UsePerformanceMonitoringResult {
  const ctx = useContext(PerformanceMonitoringContext);
  if (!ctx) {
    throw new Error('usePerformanceMonitoring must be used within PerformanceMonitoringProvider');
  }
  return ctx;
}
