export type UserRole = 'student' | 'teacher' | 'admin';

export interface Metric {
  id: string;
  title: string;
  value: number;
  change: number;
  format: 'number' | 'percent' | 'currency';
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Record<string, unknown>[];
  xAxisKey: string;
  yAxisKey: string;
  color: string;
}

export interface Widget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table';
  metricId?: string;
  chartId?: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  role: UserRole;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  dateRange?: { start: Date; end: Date };
  metrics?: string[];
}
