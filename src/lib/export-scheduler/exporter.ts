/**
 * Data Export Engine
 * Handles actual data export in various formats
 */

import { createLogger } from '@/lib/logging';
import { createCounterMetric, measureAsync } from '@/lib/logging/performance';
import {
  createCSVSnapshot,
  createJSONSnapshot,
  escapeHtml,
  escapeXml,
  ExportExecutionOptions,
  emitProgress,
  prepareExportData,
} from '@/lib/export';
import { ExportFormat, ExportTemplate } from './types';

export interface ExportData {
  headers: string[];
  rows: Array<Record<string, unknown>>;
}

const exportLogger = createLogger('export-engine');

export async function exportData(
  template: ExportTemplate,
  data: ExportData,
  options: ExportExecutionOptions = {},
): Promise<{ blob: Blob; fileName: string }> {
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${template.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

  try {
    emitProgress(options.onProgress, {
      stage: 'preparing',
      percent: 15,
      message: 'Preparing export dataset',
    });

    const preparedData = prepareExportData(data, options);

    emitProgress(options.onProgress, {
      stage: 'filtering',
      percent: 50,
      message: 'Applying filters and sorting',
    });

    const { result: blob, metric } = await measureAsync(
      `export.${template.format}`,
      async () => {
        switch (template.format) {
          case 'csv':
            return exportToCSV(preparedData);
          case 'json':
            return exportToJSON(preparedData);
          case 'xlsx':
            return exportToXLSX(preparedData);
          case 'pdf':
            return exportToPDF(preparedData, template.name);
          default:
            throw new Error(`Unsupported export format: ${template.format}`);
        }
      },
      {
        format: template.format,
        templateId: template.id,
      },
    );

    emitProgress(options.onProgress, {
      stage: 'formatting',
      percent: 85,
      message: 'Formatting export output',
    });

    exportLogger.info('Export data prepared', {
      context: {
        templateId: template.id,
        format: template.format,
        rows: preparedData.rows.length,
      },
      metrics: [metric, createCounterMetric('export.jobs', 1, { format: template.format })],
    });

    emitProgress(options.onProgress, {
      stage: 'completed',
      percent: 100,
      message: 'Export completed',
    });

    return {
      blob,
      fileName: `${fileName}.${extensionForFormat(template.format)}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown export error';

    emitProgress(options.onProgress, {
      stage: 'failed',
      percent: 100,
      message: errorMessage,
    });

    exportLogger.error('Export data failed', {
      context: {
        templateId: template.id,
        format: template.format,
        error: errorMessage,
      },
    });

    throw error;
  }
}

async function exportToCSV(data: ExportData): Promise<Blob> {
  const parts: string[] = [];
  for await (const chunk of createCSVSnapshot(data)) {
    parts.push(chunk.join('\n'));
  }

  return new Blob([parts.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

async function exportToJSON(data: ExportData): Promise<Blob> {
  const parts: string[] = [];
  for await (const chunk of createJSONSnapshot(data)) {
    parts.push(chunk);
  }

  return new Blob(parts, { type: 'application/json;charset=utf-8;' });
}

async function exportToXLSX(data: ExportData): Promise<Blob> {
  const { headers, rows } = data;

  const headerRow = headers
    .map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join('\n        ');
  const rowChunks: string[] = [];
  for (const row of rows) {
    rowChunks.push(
      `      <Row>\n${headers
        .map((header) => {
          const value = row[header];
          const type = typeof value === 'number' ? 'Number' : 'String';
          return `        <Cell><Data ss:Type="${type}">${escapeXml(
            String(value ?? ''),
          )}</Data></Cell>`;
        })
        .join('\n')}\n      </Row>`,
    );
  }

  const xml =
    '<?xml version="1.0"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
    '  <Worksheet ss:Name="Sheet1">\n' +
    '    <Table>\n' +
    '      <Row>\n' +
    `        ${headerRow}\n` +
    '      </Row>\n' +
    rowChunks.join('\n') +
    '\n    </Table>\n' +
    '  </Worksheet>\n' +
    '</Workbook>';

  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}

async function exportToPDF(data: ExportData, title: string): Promise<Blob> {
  const { headers, rows } = data;

  const headPart =
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
` +
    headers.map((header) => `        <th>${escapeHtml(header)}</th>`).join('\n') +
    `
      </tr>
    </thead>
    <tbody>
`;

  const bodyChunks: string[] = [];
  for (const row of rows) {
    bodyChunks.push(
      '      <tr>\n' +
        headers
          .map((header) => `        <td>${escapeHtml(String(row[header] ?? ''))}</td>`)
          .join('\n') +
        '\n      </tr>',
    );
  }

  const tailPart = `
    </tbody>
  </table>
</body>
</html>`;

  return new Blob([headPart, bodyChunks.join('\n'), tailPart], { type: 'text/html' });
}

function extensionForFormat(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'xlsx':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    default:
      return format;
  }
}

export async function fetchDataForTemplate(template: ExportTemplate): Promise<ExportData> {
  const mockData: ExportData = {
    headers: template.columns || ['id', 'name', 'date', 'value'],
    rows: [
      { id: 1, name: 'Sample 1', date: new Date().toISOString(), value: 100 },
      { id: 2, name: 'Sample 2', date: new Date().toISOString(), value: 200 },
      { id: 3, name: 'Sample 3', date: new Date().toISOString(), value: 300 },
    ],
  };

  return mockData;
}
