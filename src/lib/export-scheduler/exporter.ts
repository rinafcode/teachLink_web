/**
 * Data Export Engine
 * Handles actual data export in various formats
 */

import { ExportFormat, ExportTemplate } from './types';

export interface ExportData {
  headers: string[];
  rows: Array<Record<string, unknown>>;
}

export async function exportData(
  template: ExportTemplate,
  data: ExportData,
): Promise<{ blob: Blob; fileName: string }> {
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `${template.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

  switch (template.format) {
    case 'csv':
      return {
        blob: await exportToCSV(data),
        fileName: `${fileName}.csv`,
      };
    case 'json':
      return {
        blob: await exportToJSON(data),
        fileName: `${fileName}.json`,
      };
    case 'xlsx':
      return {
        blob: await exportToXLSX(data),
        fileName: `${fileName}.xlsx`,
      };
    case 'pdf':
      return {
        blob: await exportToPDF(data, template.name),
        fileName: `${fileName}.pdf`,
      };
    default:
      throw new Error(`Unsupported export format: ${template.format}`);
  }
}

async function exportToCSV(data: ExportData): Promise<Blob> {
  const { headers, rows } = data;

  // Escape CSV values
  const escape = (value: unknown): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvLines: string[] = [];
  csvLines.push(headers.map(escape).join(','));

  for (const row of rows) {
    const values = headers.map((header) => escape(row[header]));
    csvLines.push(values.join(','));
  }

  const csvContent = csvLines.join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

async function exportToJSON(data: ExportData): Promise<Blob> {
  const jsonContent = JSON.stringify(data.rows, null, 2);
  return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
}

async function exportToXLSX(data: ExportData): Promise<Blob> {
  // Simple XLSX generation (in production, use a library like 'xlsx' or 'exceljs')
  // For now, we'll create a basic XML structure
  const { headers, rows } = data;

  let xml = '<?xml version="1.0"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '  <Worksheet ss:Name="Sheet1">\n';
  xml += '    <Table>\n';

  // Header row
  xml += '      <Row>\n';
  for (const header of headers) {
    xml += `        <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  }
  xml += '      </Row>\n';

  // Data rows
  for (const row of rows) {
    xml += '      <Row>\n';
    for (const header of headers) {
      const value = row[header];
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += `        <Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>\n`;
    }
    xml += '      </Row>\n';
  }

  xml += '    </Table>\n';
  xml += '  </Worksheet>\n';
  xml += '</Workbook>';

  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}

async function exportToPDF(data: ExportData, title: string): Promise<Blob> {
  // Simple PDF generation (in production, use a library like 'jspdf' or 'pdfkit')
  // For now, we'll create a basic HTML that can be printed to PDF
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

// Mock data fetcher - in production, this would fetch from your actual data sources
export async function fetchDataForTemplate(template: ExportTemplate): Promise<ExportData> {
  // This is a mock implementation
  // In production, you would:
  // 1. Query your database based on template.dataSource
  // 2. Apply template.filters
  // 3. Select template.columns
  // 4. Return the formatted data

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
