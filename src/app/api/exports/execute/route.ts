/**
 * Execute Export API
 * POST /api/exports/execute - Execute an export immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logging';
import { createCounterMetric } from '@/lib/logging/performance';
import { withRequestLogging } from '@/middleware/logger';
import {
  ExportExecutionOptions,
  ExportFilter,
  ExportProgressState,
  ExportSort,
  prepareExportData,
} from '@/lib/export';
import { exportData, fetchDataForTemplate, getTemplate } from '@/lib/export-scheduler';

const routeLogger = createLogger('exports.execute');

function asFilters(value: unknown): ExportFilter[] | undefined {
  return Array.isArray(value) ? (value as ExportFilter[]) : undefined;
}

function asSort(value: unknown): ExportSort[] | undefined {
  return Array.isArray(value) ? (value as ExportSort[]) : undefined;
}

function asColumns(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : undefined;
}

export async function POST(request: NextRequest) {
  try {
    return await withRequestLogging(request, 'exports.execute', async (requestId) => {
      const body = await request.json();
      const templateId = typeof body.templateId === 'string' ? body.templateId : '';

      if (!templateId) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
      }

      const template = await getTemplate(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      const progress: ExportProgressState[] = [];
      const options: ExportExecutionOptions = {
        filters: asFilters(body.filters),
        sort: asSort(body.sort),
        columns: asColumns(body.columns) ?? template.columns,
        onProgress: (state) => {
          progress.push(state);
        },
      };

      const sourceData = await fetchDataForTemplate(template);
      const preparedData = prepareExportData(sourceData, options);
      const { blob, fileName } = await exportData(template, sourceData, options);

      routeLogger.info('Export generated on demand', {
        requestId,
        context: {
          templateId,
          fileName,
          rows: sourceData.rows.length,
        },
        metrics: [createCounterMetric('export.requests', 1, { format: template.format })],
      });

      return NextResponse.json({
        result: {
          success: true,
          fileName,
          fileSize: blob.size,
          contentType: blob.type,
          rowCount: preparedData.rows.length,
          progress,
        },
      });
    });
  } catch (error) {
    routeLogger.error('Failed to execute export', { error });
    return NextResponse.json({ error: 'Failed to execute export' }, { status: 500 });
  }
}
