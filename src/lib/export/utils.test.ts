import { describe, expect, it } from 'vitest';
import { defaultSort, normalizeFilters, prepareExportData } from './utils';

describe('export utilities', () => {
  const dataset = {
    headers: ['id', 'name', 'status', 'date', 'value'],
    rows: [
      { id: 1, name: 'Gamma', status: 'inactive', date: '2024-01-01', value: 10 },
      { id: 2, name: 'Alpha', status: 'active', date: '2024-03-01', value: 30 },
      { id: 3, name: 'Beta', status: 'active', date: '2024-02-01', value: 20 },
    ],
  };

  it('filters and sorts rows before export', () => {
    const prepared = prepareExportData(dataset, {
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      sort: [{ field: 'name', direction: 'asc' }],
      columns: ['id', 'name'],
    });

    expect(prepared.headers).toEqual(['id', 'name']);
    expect(prepared.rows).toEqual([
      { id: 2, name: 'Alpha' },
      { id: 3, name: 'Beta' },
    ]);
  });

  it('normalizes object filters and creates a sensible default sort', () => {
    expect(normalizeFilters({ status: 'active' })).toEqual([
      { field: 'status', operator: 'eq', value: 'active' },
    ]);
    expect(defaultSort(['id', 'createdDate'])).toEqual([
      { field: 'createdDate', direction: 'desc' },
    ]);
  });
});
