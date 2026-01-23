export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface Metric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  format: 'number' | 'percent' | 'currency' | 'duration';
  description?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  color: string;
  description?: string;
}

export interface Widget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  chartId?: string;
  metricId?: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
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
  format: ExportFormat;
  includeCharts: boolean;
  dateRange: { start: Date; end: Date };
  filters: Record<string, any>;
}