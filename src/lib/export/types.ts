export type ExportFilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface ExportFilter {
  field: string;
  operator: ExportFilterOperator;
  value: unknown;
}

export interface ExportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ExportProgressState {
  stage: 'preparing' | 'filtering' | 'formatting' | 'completed';
  percent: number;
  message: string;
}

export interface ExportExecutionOptions {
  filters?: ExportFilter[];
  sort?: ExportSort[];
  columns?: string[];
  onProgress?: (state: ExportProgressState) => void;
}
