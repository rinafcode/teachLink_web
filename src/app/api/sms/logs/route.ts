/**
 * SMS Logs API Route
 *
 * Provides endpoints for retrieving and managing SMS logs aggregation data.
 * Supports filtering, metrics generation, and data export.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api:sms:logs');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'query';

  logger.info('SMS logs API request', {
    context: {
      action,
      method: 'GET',
    },
  });

  try {
    switch (action) {
      case 'metrics': {
        const timeRangeMs = parseInt(searchParams.get('timeRangeMs') || '86400000');
        const metrics = await SMSLogAggregator.getMetrics(timeRangeMs);

        logger.info('SMS metrics retrieved', {
          context: {
            totalMessages: metrics.totalMessages,
            successRate: metrics.successRate,
          },
        });

        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }

      case 'failed': {
        const limit = parseInt(searchParams.get('limit') || '100');
        const failed = await SMSLogAggregator.getFailedMessages(limit);

        logger.info('Failed messages retrieved', {
          context: {
            count: failed.length,
          },
        });

        return NextResponse.json({
          success: true,
          data: failed,
          count: failed.length,
        });
      }

      case 'anomalies': {
        const anomalies = await SMSLogAggregator.getAnomalies();

        logger.info('Anomalies retrieved', {
          context: {
            slowDeliveries: anomalies.slowDeliveries.length,
            highRetryAttempts: anomalies.highRetryAttempts.length,
            configurationErrors: anomalies.configurationErrors.length,
          },
        });

        return NextResponse.json({
          success: true,
          data: anomalies,
        });
      }

      case 'store-stats': {
        const stats = SMSLogAggregator.getStoreStats();

        return NextResponse.json({
          success: true,
          data: stats,
        });
      }

      case 'export': {
        const format = (searchParams.get('format') as 'json' | 'csv') || 'json';
        const since = searchParams.get('since') ? parseInt(searchParams.get('since')!) : undefined;
        const limit = parseInt(searchParams.get('limit') || '10000');
        const exportData = await SMSLogAggregator.exportLogs(format, { since, limit });

        logger.info('SMS logs exported', {
          context: {
            format,
            size: exportData.length,
          },
        });

        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        const filename = `sms-logs-${new Date().toISOString()}.${format}`;

        return new NextResponse(exportData, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      case 'query':
      default: {
        const level = searchParams.getAll('level');
        const provider = searchParams.get('provider') || undefined;
        const eventType = searchParams.get('eventType') || undefined;
        const status = searchParams.get('status') || undefined;
        const since = searchParams.get('since') ? parseInt(searchParams.get('since')!) : undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const logs = await SMSLogAggregator.queryLogs({
          level: level.length > 0 ? level : undefined,
          provider,
          eventType,
          status,
          since,
          limit,
          offset,
        });

        logger.info('SMS logs queried', {
          context: {
            count: logs.length,
            provider,
            eventType,
            status,
          },
        });

        return NextResponse.json({
          success: true,
          data: logs,
          count: logs.length,
        });
      }
    }
  } catch (error) {
    logger.error('SMS logs API error', {
      context: {
        action,
      },
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'clear';

  logger.info('SMS logs API request', {
    context: {
      action,
      method: 'POST',
    },
  });

  try {
    switch (action) {
      case 'clear-old': {
        const olderThanMs = parseInt(
          (await request.json()).olderThanMs || '2592000000', // 30 days
        );
        const deletedCount = await SMSLogAggregator.clearOldLogs(olderThanMs);

        logger.info('Old SMS logs cleared', {
          context: {
            deletedCount,
            olderThanMs,
          },
        });

        return NextResponse.json({
          success: true,
          deletedCount,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown action',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    logger.error('SMS logs API error', {
      context: {
        action,
      },
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
