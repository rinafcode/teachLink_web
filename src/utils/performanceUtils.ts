/**
 * Performance utilities: Core Web Vitals (web-vitals), trends, suggestions, and helpers.
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  label?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  id?: string;
  delta?: number;
  navigationType?: Metric['navigationType'];
}

export interface PerformanceTrendPoint {
  t: number;
  name: string;
  value: number;
  rating?: PerformanceMetric['rating'];
}

export interface PerformanceAlert {
  id: string;
  at: number;
  severity: 'warning' | 'critical';
  message: string;
  metricName: string;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  detail: string;
  impact: 'high' | 'medium' | 'low';
  metric?: string;
}

const TREND_STORAGE_KEY = 'teachlink:perf:trends';
const MAX_TREND_POINTS = 200;

const vitalListeners = new Set<(metric: PerformanceMetric) => void>();
let vitalsStarted = false;

export function metricFromWebVital(m: Metric): PerformanceMetric {
  return {
    name: m.name,
    value: m.value,
    label: m.name === 'CLS' ? undefined : 'ms',
    rating: m.rating,
    id: m.id,
    delta: m.delta,
    navigationType: m.navigationType,
  };
}

function ensureVitalsStarted(): void {
  if (typeof window === 'undefined' || vitalsStarted) return;
  vitalsStarted = true;
  const emit = (metric: Metric) => {
    const pm = metricFromWebVital(metric);
    vitalListeners.forEach((fn) => fn(pm));
  };
  onCLS(emit);
  onINP(emit);
  onLCP(emit);
  onFCP(emit);
  onTTFB(emit);
}

/**
 * Subscribe to Core Web Vitals updates. Multiple subscribers share one underlying observer set.
 * @returns Unsubscribe function.
 */
export function subscribeCoreWebVitals(onReport: (metric: PerformanceMetric) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  vitalListeners.add(onReport);
  ensureVitalsStarted();
  return () => {
    vitalListeners.delete(onReport);
  };
}

/**
 * @deprecated Prefer subscribeCoreWebVitals for cleanup support; this matches the legacy API (no unsubscribe).
 */
export const measureWebVitals = (onReport: (metric: PerformanceMetric) => void): void => {
  subscribeCoreWebVitals(onReport);
};

export function appendTrendPoint(point: PerformanceTrendPoint): PerformanceTrendPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(TREND_STORAGE_KEY);
    const data: PerformanceTrendPoint[] = raw ? JSON.parse(raw) : [];
    data.push(point);
    const next = data.slice(-MAX_TREND_POINTS);
    sessionStorage.setItem(TREND_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function loadTrendHistory(): PerformanceTrendPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(TREND_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as PerformanceTrendPoint[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function clearTrendHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TREND_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function evaluatePerformanceDegradation(metric: PerformanceMetric): PerformanceAlert | null {
  if (!metric.rating) return null;
  if (metric.rating === 'poor') {
    return {
      id: `${metric.name}-${metric.id ?? metric.value}-${metric.rating}`,
      at: Date.now(),
      severity: 'critical',
      metricName: metric.name,
      message: `${metric.name} is in the "poor" range (${formatMetricValue(
        metric,
      )}). Consider optimization.`,
    };
  }
  if (metric.rating === 'needs-improvement') {
    return {
      id: `${metric.name}-${metric.id ?? metric.value}-ni`,
      at: Date.now(),
      severity: 'warning',
      metricName: metric.name,
      message: `${metric.name} needs improvement (${formatMetricValue(metric)}).`,
    };
  }
  return null;
}

export function formatMetricValue(metric: PerformanceMetric): string {
  if (metric.name === 'CLS') return metric.value.toFixed(3);
  return `${metric.value.toFixed(0)}${metric.label ?? 'ms'}`;
}

export function buildOptimizationSuggestions(
  metrics: Record<string, PerformanceMetric>,
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  const push = (s: OptimizationSuggestion) => {
    if (!suggestions.some((x) => x.id === s.id)) suggestions.push(s);
  };

  const lcp = metrics.LCP;
  if (lcp?.rating && lcp.rating !== 'good') {
    push({
      id: 'lcp-hero',
      metric: 'LCP',
      impact: 'high',
      title: 'Speed up largest contentful paint',
      detail:
        'Optimize the LCP element: use responsive images, modern formats (AVIF/WebP), explicit width/height, and preload the hero resource. Reduce server response and render-blocking scripts.',
    });
  }

  const inp = metrics.INP;
  if (inp?.rating && inp.rating !== 'good') {
    push({
      id: 'inp-main-thread',
      metric: 'INP',
      impact: 'high',
      title: 'Improve interaction responsiveness',
      detail:
        'Break up long tasks, defer non-critical JavaScript, and avoid large synchronous updates in event handlers. Prefer transitions and smaller component trees on interaction paths.',
    });
  }

  const cls = metrics.CLS;
  if (cls?.rating && cls.rating !== 'good') {
    push({
      id: 'cls-layout',
      metric: 'CLS',
      impact: 'high',
      title: 'Stabilize layout',
      detail:
        'Reserve space for images, embeds, and ads. Avoid inserting content above existing content without a placeholder. Prefer transform animations over properties that trigger layout.',
    });
  }

  const fcp = metrics.FCP;
  if (fcp?.rating && fcp.rating !== 'good') {
    push({
      id: 'fcp-paint',
      metric: 'FCP',
      impact: 'medium',
      title: 'Reach first paint sooner',
      detail:
        'Inline critical CSS, trim unused CSS, and reduce font-blocking. Keep HTML and critical path assets small and cacheable.',
    });
  }

  const ttfb = metrics.TTFB;
  if (ttfb?.rating && ttfb.rating !== 'good') {
    push({
      id: 'ttfb-server',
      metric: 'TTFB',
      impact: 'medium',
      title: 'Reduce time to first byte',
      detail:
        'Improve edge caching, optimize server/API latency, and use a CDN for static and dynamic assets where possible.',
    });
  }

  if (isSlowConnection()) {
    push({
      id: 'net-slow',
      impact: 'medium',
      title: 'Adapt for slow networks',
      detail:
        'Detected a constrained connection. Reduce payload sizes, lazy-load below-the-fold content, and avoid aggressive prefetching.',
    });
  }

  return suggestions;
}

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
  return result;
};

/**
 * Async version of trackDuration.
 */
export const trackDurationAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return result;
};

/** Mark the start of a named phase (Performance API). */
export function markPerformancePhase(markName: string): void {
  if (typeof performance === 'undefined' || !performance.mark) return;
  try {
    performance.mark(markName);
  } catch {
    /* ignore */
  }
}

/** Measure elapsed time between two marks. */
export function measurePerformancePhase(
  measureName: string,
  startMark: string,
  endMark: string,
): number | null {
  if (typeof performance === 'undefined' || !performance.measure) return null;
  try {
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, 'measure');
    const last = entries[entries.length - 1];
    return last ? last.duration : null;
  } catch {
    return null;
  }
}

/** Run work during browser idle time when available. */
export function runWhenIdle(callback: () => void, timeoutMs = 2000): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  const ric = window.requestIdleCallback;
  if (typeof ric === 'function') {
    ric.call(window, () => callback(), { timeout: timeoutMs });
  } else {
    window.setTimeout(callback, 1);
  }
}

/**
 * Report a performance metric to the analytics service.
 */
export async function reportVitalToAnalytics(metric: PerformanceMetric): Promise<void> {
  if (typeof window === 'undefined') return;

  // Only report in production or if explicitly enabled
  const shouldReport =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_PERF_ANALYTICS === 'true';

  if (!shouldReport) {
    console.debug(`[Performance Analytics] Skipping report for ${metric.name} in development`);
    return;
  }

  runWhenIdle(async () => {
    try {
      const body = JSON.stringify({
        ...metric,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      const response = await fetch('/api/performance/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        // Use keepalive to ensure the request is sent even if the page is closed
        keepalive: true,
      });

      if (!response.ok) {
        console.warn(
          `[Performance Analytics] Failed to send ${metric.name}: ${response.statusText}`,
        );
      }
    } catch (err) {
      console.error(`[Performance Analytics] Error sending ${metric.name}:`, err);
    }
  });
}
