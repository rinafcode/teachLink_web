import type { AggregationType, ChartType, TimeRange } from '@/utils/visualizationUtils';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const PANEL_TITLE_FALLBACKS: Record<string, string> = {
  enrollments: 'Course Enrollments',
  revenue: 'Revenue',
  completions: 'Completions',
  realtime: 'Live Activity',
};

const PANEL_DATASET_FALLBACKS: Record<string, string> = {
  enrollments: 'Course Enrollments',
  revenue: 'Revenue',
  completions: 'Completions',
  realtime: 'Live Data',
  views: 'Course Views',
};

const TIME_RANGE_FALLBACKS: Record<TimeRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '1y': 'Last Year',
  all: 'All Time',
};

const AGGREGATION_FALLBACKS: Record<AggregationType, string> = {
  sum: 'Sum',
  average: 'Average',
  count: 'Count',
  min: 'Min',
  max: 'Max',
};

const METRIC_FALLBACKS: Record<string, string> = {
  enrollments: 'Enrollments',
  revenue: 'Revenue',
  completions: 'Completions',
  views: 'Views',
};

const METRIC_KEY_MAP: Record<string, string> = {
  enrollments: 'enrollments',
  revenue: 'revenue',
  completions: 'completions',
  views: 'views',
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  'Web Dev': 'Web Dev',
  'Data Science': 'Data Science',
  Design: 'Design',
  Marketing: 'Marketing',
  Mobile: 'Mobile',
};

const CATEGORY_KEY_MAP: Record<string, string> = {
  'Web Dev': 'webDev',
  'Data Science': 'dataScience',
  Design: 'design',
  Marketing: 'marketing',
  Mobile: 'mobile',
};

const CHART_TYPE_FALLBACKS: Record<ChartType, string> = {
  line: 'Line chart',
  bar: 'Bar chart',
  pie: 'Pie chart',
  doughnut: 'Doughnut chart',
  area: 'Area chart',
  scatter: 'Scatter chart',
  radar: 'Radar chart',
  heatmap: 'Heatmap chart',
};

export function translateWithFallback(
  t: TranslateFn,
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
): string {
  const translated = t(key, params);
  return translated === key ? fallback : translated;
}

export function getDashboardPanelTitle(panelId: string, t: TranslateFn): string {
  return translateWithFallback(
    t,
    `dashboard.analytics.panels.${panelId}.title`,
    PANEL_TITLE_FALLBACKS[panelId] ?? panelId,
  );
}

export function getDashboardDatasetLabel(panelId: string, t: TranslateFn): string {
  return translateWithFallback(
    t,
    `dashboard.analytics.datasets.${panelId}`,
    PANEL_DATASET_FALLBACKS[panelId] ?? 'Metric',
  );
}

export function getDashboardTimeRangeLabel(value: TimeRange, t: TranslateFn): string {
  return translateWithFallback(
    t,
    `dashboard.analytics.filters.timeRangeOptions.${value}`,
    TIME_RANGE_FALLBACKS[value],
  );
}

export function getDashboardAggregationLabel(value: AggregationType, t: TranslateFn): string {
  return translateWithFallback(
    t,
    `dashboard.analytics.filters.aggregationOptions.${value}`,
    AGGREGATION_FALLBACKS[value],
  );
}

export function getDashboardMetricLabel(metric: string, t: TranslateFn): string {
  const metricKey = METRIC_KEY_MAP[metric];
  if (!metricKey) {
    return metric;
  }

  return translateWithFallback(
    t,
    `dashboard.analytics.filters.metrics.${metricKey}`,
    METRIC_FALLBACKS[metric],
  );
}

export function getDashboardCategoryLabel(category: string, t: TranslateFn): string {
  const categoryKey = CATEGORY_KEY_MAP[category];
  if (!categoryKey) {
    return category;
  }

  return translateWithFallback(
    t,
    `dashboard.analytics.filters.categoriesOptions.${categoryKey}`,
    CATEGORY_FALLBACKS[category],
  );
}

export function getDashboardChartTypeLabel(type: ChartType, t: TranslateFn): string {
  return translateWithFallback(
    t,
    `dashboard.analytics.chartTypes.${type}`,
    CHART_TYPE_FALLBACKS[type],
  );
}
