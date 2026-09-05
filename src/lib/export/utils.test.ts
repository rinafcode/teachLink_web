import { describe, expect, it } from 'vitest';
import {
  createCSVSnapshot,
  createJSONSnapshot,
  defaultSort,
  escapeCSVCell,
  normalizeFilters,
  prepareExportData,
} from './utils';

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

  it('escapes CSV cells containing delimiters, quotes, and newlines', () => {
    expect(escapeCSVCell('plain')).toBe('plain');
    expect(escapeCSVCell('a,b')).toBe('"a,b"');
    expect(escapeCSVCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCSVCell('line\nbreak')).toBe('"line\nbreak"');
    expect(escapeCSVCell(null)).toBe('');
    expect(escapeCSVCell(undefined)).toBe('');
    expect(escapeCSVCell(0)).toBe('0');
  });

  it('streams CSV in bounded chunks with a leading header row', async () => {
    const chunks: string[][] = [];
    for await (const chunk of createCSVSnapshot(dataset, { chunkSize: 2 })) {
      chunks.push(chunk);
    }

    const lines = chunks.flat();
    expect(lines[0]).toBe('id,name,status,date,value');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('Gamma');
    expect(lines[3]).toContain('Beta');
    expect(chunks).toHaveLength(3);
    expect(chunks[1]).toHaveLength(2);
    expect(chunks[2]).toHaveLength(1);
  });

  it('emits a header-only CSV when there are no rows', async () => {
    const chunks: string[][] = [];
    for await (const chunk of createCSVSnapshot({ headers: ['a'], rows: [] })) {
      chunks.push(chunk);
    }

    const lines = chunks.flat();
    expect(lines).toEqual(['a']);
  });

  it('reports per-chunk progress via onChunk callback', async () => {
    const seen: Array<{ index: number; total: number }> = [];
    for await (const _chunk of createCSVSnapshot(dataset, {
      chunkSize: 2,
      onChunk: (index, total) => seen.push({ index, total }),
    })) {
      // drain generator
    }

    expect(seen).toEqual([
      { index: 2, total: 3 },
      { index: 3, total: 3 },
    ]);
  });

  it('streams JSON row chunks that join into a valid, pretty-printed array', async () => {
    const parts: string[] = [];
    for await (const part of createJSONSnapshot(dataset, { chunkSize: 2 })) {
      parts.push(part);
    }

    const payload = parts.join('');
    const parsed = JSON.parse(payload);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe('Gamma');
    expect(parsed[2].name).toBe('Beta');
    expect(payload).toBe(JSON.stringify(dataset.rows, null, 2));
  });

  it('emits an empty JSON array when there are no rows', async () => {
    const parts: string[] = [];
    for await (const part of createJSONSnapshot({ headers: ['a'], rows: [] })) {
      parts.push(part);
    }

    expect(parts.join('')).toBe('[]');
  });
});
