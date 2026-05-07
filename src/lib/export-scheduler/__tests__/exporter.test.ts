/**
 * Tests for Data Exporter
 */

import { describe, it, expect } from 'vitest';
import { exportData, fetchDataForTemplate } from '../exporter';
import { ExportTemplate } from '../types';

describe('Data Exporter', () => {
  const mockTemplate: ExportTemplate = {
    id: 'test-1',
    name: 'Test Export',
    format: 'csv',
    dataSource: 'courses',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
  };

  const mockData = {
    headers: ['id', 'name', 'value'],
    rows: [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
    ],
  };

  describe('exportData', () => {
    it('should export to CSV', async () => {
      const result = await exportData(mockTemplate, mockData);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('.csv');
      expect(result.blob.type).toContain('text/csv');
    });

    it('should export to JSON', async () => {
      const template = { ...mockTemplate, format: 'json' as const };
      const result = await exportData(template, mockData);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('.json');
      expect(result.blob.type).toContain('application/json');
    });

    it('should export to XLSX', async () => {
      const template = { ...mockTemplate, format: 'xlsx' as const };
      const result = await exportData(template, mockData);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('.xlsx');
    });

    it('should export to PDF', async () => {
      const template = { ...mockTemplate, format: 'pdf' as const };
      const result = await exportData(template, mockData);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.fileName).toContain('.pdf');
    });

    it('should throw error for unsupported format', async () => {
      const template = { ...mockTemplate, format: 'invalid' as any };
      await expect(exportData(template, mockData)).rejects.toThrow();
    });
  });

  describe('fetchDataForTemplate', () => {
    it('should fetch mock data', async () => {
      const data = await fetchDataForTemplate(mockTemplate);
      expect(data).toHaveProperty('headers');
      expect(data).toHaveProperty('rows');
      expect(Array.isArray(data.headers)).toBe(true);
      expect(Array.isArray(data.rows)).toBe(true);
    });
  });
});
