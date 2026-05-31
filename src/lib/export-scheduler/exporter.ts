/**
 * Data Export Engine
 * Handles actual data export in various formats
 */

import { createLogger } from '@/lib/logging';
import { createCounterMetric, measureAsync } from '@/lib/logging/performance';
import { ExportExecutionOptions, emitProgress, prepareExportData } from '@/lib/export';
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
}

async function exportToCSV(data: ExportData): Promise<Blob> {
  const { headers, rows } = data;

  const escape = (value: unknown): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines: string[] = [];
  csvLines.push(headers.map(escape).join(','));

  for (const row of rows) {
    const values = headers.map((header) => escape(row[header]));
    csvLines.push(values.join(','));
  }

  return new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

async function exportToJSON(data: ExportData): Promise<Blob> {
  return new Blob([JSON.stringify(data.rows, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
}

async function exportToXLSX(data: ExportData): Promise<Blob> {
  const { headers, rows } = data;

  let xml = '<?xml version="1.0"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '  <Worksheet ss:Name="Sheet1">\n';
  xml += '    <Table>\n';
  xml += '      <Row>\n';

  for (const header of headers) {
    xml += `        <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  }

  xml += '      </Row>\n';

  for (const row of rows) {
    xml += '      <Row>\n';
    for (const header of headers) {
      const value = row[header];
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += `        <Cell><Data ss:Type="${type}">${escapeXml(
        String(value ?? ''),
      )}</Data></Cell>\n`;
    }
    xml += '      </Row>\n';
  }

  xml += '    </Table>\n';
  xml += '  </Worksheet>\n';
  xml += '</Workbook>';

  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}

async function exportToPDF(data: ExportData, title: string): Promise<Blob> {
  const { headers, rows } = data;

  let html = `<!DOCTYPE html>
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
`;

  for (const header of headers) {
    html += `        <th>${escapeHtml(header)}</th>\n`;
  }

  html += `      </tr>
    </thead>
    <tbody>
`;

  for (const row of rows) {
    html += '      <tr>\n';
    for (const header of headers) {
      html += `        <td>${escapeHtml(String(row[header] ?? ''))}</td>\n`;
    }
    html += '      </tr>\n';
  }

  html += `    </tbody>
  </table>
</body>
</html>`;

  return new Blob([html], { type: 'text/html' });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
