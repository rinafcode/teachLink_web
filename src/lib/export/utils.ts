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

export interface ExportStreamOptions {
  /** Max rows per yielded chunk. Keeps memory per chunk bounded on large datasets. */
  chunkSize?: number;
  /** Optional hook invoked after each chunk is produced (e.g. to surface progress). */
  onChunk?: (index: number, total: number, chunk: string[]) => void;
}

export function escapeCSVCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Yield a CSV payload in bounded chunks instead of building the whole
 * string in memory. Each chunk contains a batch of `chunkSize` rows.
 */
export async function* createCSVSnapshot(
  data: ExportDataset,
  options: ExportStreamOptions = {},
): AsyncGenerator<string[], void, unknown> {
  const { chunkSize = 500, onChunk } = options;
  const { headers, rows } = data;

  const headerChunk = [headers.map(escapeCSVCell).join(',')];
  yield headerChunk;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const batch = rows.slice(index, index + chunkSize);
    const chunk: string[] = [];
    for (const row of batch) {
      chunk.push(headers.map((header) => escapeCSVCell(row[header])).join(','));
    }
    onChunk?.(index + batch.length, rows.length, chunk);
    yield chunk;
  }
}

/**
 * Yield a JSON array payload in bounded chunks. The wrapper `[` and `]`
 * delimiters are emitted separately so memory stays bounded to `chunkSize`
 * rows on large datasets.
 */
export async function* createJSONSnapshot(
  data: ExportDataset,
  options: ExportStreamOptions = {},
): AsyncGenerator<string, void, unknown> {
  const { chunkSize = 500, onChunk } = options;
  const { rows } = data;

  if (rows.length === 0) {
    yield '[]';
    return;
  }

  const indent = (value: unknown): string =>
    JSON.stringify(value, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');

  yield '[\n';
  for (let index = 0; index < rows.length; index += chunkSize) {
    const batch = rows.slice(index, index + chunkSize);
    const chunk: string[] = [];
    for (let rowIndex = 0; rowIndex < batch.length; rowIndex += 1) {
      const globalIndex = index + rowIndex;
      const isLast = globalIndex === rows.length - 1;
      chunk.push(`${indent(batch[rowIndex])}${isLast ? '' : ','}\n`);
    }
    onChunk?.(index + batch.length, rows.length, chunk);
    yield chunk.join('');
  }
  yield ']';
}
