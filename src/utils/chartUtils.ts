/**
 * chartUtils.ts
 * Dashboard-specific utility helpers for the Advanced Data Visualization Dashboard.
 * Builds on top of visualizationUtils.ts for shared types and base helpers.
 */

import {
  ChartData,
  TimeRange,
  AggregationType,
  generateDateLabels,
  generateSampleData,
} from '@/utils/visualizationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardMetricType = 'currency' | 'percent' | 'count';

export interface DashboardShareConfig {
  timeRange: TimeRange;
  categories: string[];
  metric: string;
  aggregation: AggregationType;
  panelOrder: string[];
}

// ─── Sample data generators ───────────────────────────────────────────────────

const PANEL_DATA_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; min: number; max: number }
> = {
  enrollments: {
    label: 'Course Enrollments',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.15)',
    min: 20,
    max: 120,
  },
  revenue: {
    label: 'Revenue ($)',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.15)',
    min: 500,
    max: 4000,
  },
  completions: {
    label: 'Completions',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.15)',
    min: 10,
    max: 90,
  },
  views: {
    label: 'Course Views',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.15)',
    min: 100,
    max: 800,
  },
};

/**
 * Generate deterministic-looking sample data for a given panel ID.
 * Falls back to generic random data for unknown panel IDs.
 */
export const generateDashboardSampleData = (
  panelId: string,
  timeRange: TimeRange = '30d',
): ChartData => {
  const cfg = PANEL_DATA_CONFIG[panelId] ?? {
    label: 'Metric',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.15)',
    min: 0,
    max: 100,
  };

  const labels = generateDateLabels(timeRange);
  const data = generateSampleData(labels.length, cfg.min, cfg.max);

  return {
    labels,
    datasets: [
      {
        label: cfg.label,
        data,
        borderColor: cfg.color,
        backgroundColor: cfg.bgColor,
        borderWidth: 2,
      },
    ],
  };
};

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a numeric value for display on dashboard KPI cards.
 */
export const formatDashboardMetric = (
  value: number,
  type: DashboardMetricType = 'count',
): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'count':
    default:
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return String(Math.round(value));
  }
};

// ─── Share URL helpers ────────────────────────────────────────────────────────

/**
 * Encode dashboard configuration into a URL search string.
 * Example output: ?timeRange=30d&metric=enrollments&categories=Web,React&panelOrder=enrollments,revenue
 */
export const generateShareableURL = (config: DashboardShareConfig): string => {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams();
  params.set('timeRange', config.timeRange);
  params.set('metric', config.metric);
  params.set('aggregation', config.aggregation);
  if (config.categories.length > 0) {
    params.set('categories', config.categories.join(','));
  }
  if (config.panelOrder.length > 0) {
    params.set('panelOrder', config.panelOrder.join(','));
  }

  const { origin, pathname } = window.location;
  return `${origin}${pathname}?${params.toString()}`;
};

/**
 * Parse a URL search string back into a partial DashboardShareConfig.
 */
export const parseDashboardURL = (search: string): Partial<DashboardShareConfig> => {
  const params = new URLSearchParams(search);
  const result: Partial<DashboardShareConfig> = {};

  const timeRange = params.get('timeRange');
  if (timeRange) result.timeRange = timeRange as TimeRange;

  const metric = params.get('metric');
  if (metric) result.metric = metric;

  const aggregation = params.get('aggregation');
  if (aggregation) result.aggregation = aggregation as AggregationType;

  const categories = params.get('categories');
  if (categories) result.categories = categories.split(',').filter(Boolean);

  const panelOrder = params.get('panelOrder');
  if (panelOrder) result.panelOrder = panelOrder.split(',').filter(Boolean);

  return result;
};

// ─── Drill-down helpers ───────────────────────────────────────────────────────

/**
 * Return a new ChartData that contains only the single data point at `labelIndex`.
 * Used to render the drill-down detail panel in InteractiveCharts.
 */
export const getDrillDownData = (data: ChartData, labelIndex: number): ChartData => {
  const label = data.labels[labelIndex] ?? 'Selected';
  return {
    labels: [label],
    datasets: data.datasets.map((ds) => ({
      ...ds,
      data: [ds.data[labelIndex] ?? 0],
    })),
  };
};
