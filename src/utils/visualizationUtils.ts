/**
 * Visualization Utilities
 * Helper functions for data transformation, formatting, and chart configuration
 */

export interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  category?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'heatmap';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max';

/**
 * Color palette for charts
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

export const CHART_COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
];

/**
 * Format number with appropriate suffix (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Generate date range labels
 */
export const generateDateLabels = (
  range: TimeRange,
  format: 'short' | 'long' = 'short'
): string[] => {
  const now = new Date();
  const labels: string[] = [];
  let days = 7;

  switch (range) {
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    case '1y':
      days = 365;
      break;
    default:
      days = 7;
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    if (format === 'short') {
      labels.push(
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
    } else {
      labels.push(date.toLocaleDateString('en-US'));
    }
  }

  return labels;
};

/**
 * Aggregate data by time period
 */
export const aggregateByTimePeriod = (
  data: DataPoint[],
  period: 'day' | 'week' | 'month',
  aggregation: AggregationType = 'sum'
): DataPoint[] => {
  const grouped = new Map<string, number[]>();

  data.forEach((point) => {
    const date = new Date(point.x);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(point.y);
  });

  const result: DataPoint[] = [];
  grouped.forEach((values, key) => {
    let aggregatedValue: number;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
    }

    result.push({ x: key, y: aggregatedValue });
  });

  return result.sort((a, b) => String(a.x).localeCompare(String(b.x)));
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  data: number[],
  windowSize: number
): number[] => {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(average);
  }

  return result;
};

/**
 * Normalize data to 0-100 scale
 */
export const normalizeData = (data: number[]): number[] => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) return data.map(() => 50);

  return data.map((value) => ((value - min) / range) * 100);
};

/**
 * Calculate trend (positive, negative, or neutral)
 */
export const calculateTrend = (
  data: number[]
): { direction: 'up' | 'down' | 'neutral'; percentage: number } => {
  if (data.length < 2) {
    return { direction: 'neutral', percentage: 0 };
  }

  const first = data[0];
  const last = data[data.length - 1];
  const change = ((last - first) / first) * 100;

  if (Math.abs(change) < 1) {
    return { direction: 'neutral', percentage: 0 };
  }

  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
};

/**
 * Export chart data to CSV
 */
export const exportToCSV = (data: ChartData, filename: string): void => {
  const rows: string[] = [];

  // Header row
  rows.push(['Label', ...data.datasets.map((d) => d.label)].join(','));

  // Data rows
  data.labels.forEach((label, index) => {
    const row = [label, ...data.datasets.map((d) => d.data[index])];
    rows.push(row.join(','));
  });

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Export chart data to JSON
 */
export const exportToJSON = (data: ChartData, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Generate sample data for testing
 */
export const generateSampleData = (
  points: number,
  min = 0,
  max = 100
): number[] => {
  return Array.from({ length: points }, () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
};

/**
 * Calculate statistics for a dataset
 */
export const calculateStatistics = (
  data: number[]
): {
  mean: number;
  median: number;
  mode: number;
  min: number;
  max: number;
  stdDev: number;
} => {
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  const median =
    data.length % 2 === 0
      ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
      : sorted[Math.floor(data.length / 2)];

  const frequency = new Map<number, number>();
  data.forEach((value) => {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  });
  const mode = Array.from(frequency.entries()).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    data.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    mode,
    min: Math.min(...data),
    max: Math.max(...data),
    stdDev,
  };
};
