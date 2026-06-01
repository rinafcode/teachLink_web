import { ExportExecutionOptions, ExportFilter, ExportProgressState, ExportSort } from './types';

export interface ExportDataset {
  headers: string[];
  rows: Array<Record<string, unknown>>;
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left == null) return -1;
  if (right == null) return 1;

  const leftDate = Date.parse(String(left));
  const rightDate = Date.parse(String(right));
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function matchesFilter(row: Record<string, unknown>, filter: ExportFilter): boolean {
  const value = row[filter.field];
  switch (filter.operator) {
    case 'eq':
      return value === filter.value;
    case 'neq':
      return value !== filter.value;
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filter.value ?? '').toLowerCase());
    case 'gt':
      return compareValues(value, filter.value) > 0;
    case 'gte':
      return compareValues(value, filter.value) >= 0;
    case 'lt':
      return compareValues(value, filter.value) < 0;
    case 'lte':
      return compareValues(value, filter.value) <= 0;
    default:
      return true;
  }
}

export function emitProgress(
  onProgress: ExportExecutionOptions['onProgress'],
  state: ExportProgressState,
): void {
  onProgress?.(state);
}

export function normalizeFilters(input?: Record<string, unknown>): ExportFilter[] {
  if (!input) {
    return [];
  }

  return Object.entries(input).map(([field, value]) => ({
    field,
    operator: 'eq',
    value,
  }));
}

export function prepareExportData(
  data: ExportDataset,
  options: Pick<ExportExecutionOptions, 'filters' | 'sort' | 'columns'> = {},
): ExportDataset {
  const filters = options.filters ?? [];
  const sort = options.sort ?? [];
  const columns = options.columns && options.columns.length > 0 ? options.columns : data.headers;

  let rows = [...data.rows];

  if (filters.length > 0) {
    rows = rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
  }

  if (sort.length > 0) {
    rows.sort((left, right) => {
      for (const rule of sort) {
        const comparison = compareValues(left[rule.field], right[rule.field]);
        if (comparison !== 0) {
          return rule.direction === 'desc' ? comparison * -1 : comparison;
        }
      }

      return 0;
    });
  }

  return {
    headers: columns,
    rows: rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column, row[column] ?? ''])),
    ),
  };
}

export function defaultSort(columns?: string[]): ExportSort[] {
  if (!columns || columns.length === 0) {
    return [];
  }

  const dateColumn = columns.find((column) => /date|created|updated/i.test(column));
  if (dateColumn) {
    return [{ field: dateColumn, direction: 'desc' }];
  }

  return [{ field: columns[0], direction: 'asc' }];
}
