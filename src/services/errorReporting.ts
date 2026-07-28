/**
 * Error Reporting Service
 * Handles error logging, analytics, and debugging insights.
 *
 * This service is the engine behind the Sentry-compatible public API in
 * `src/lib/errors/index.ts`. It integrates with the structured logging
 * system (`src/lib/logging`) so that every error report is:
 *
 * - Emitted as a structured JSON log record (via the Pino logger)
 * - Stored in the in-memory transport for diagnostics/testing
 * - Optionally forwarded to an HTTP aggregation endpoint
 * - Optionally sent to `/api/errors/report` in production for server-side
 *   persistence with PII redaction and rate limiting
 */

import { formatErrorForLogging } from '@/utils/errorUtils';
import { createLogger } from '@/lib/logging';

const logger = createLogger('error-reporting');

export interface ErrorReport {
  id: string;
  timestamp: string;
  errorData: Record<string, any>;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  breadcrumbs?: BreadcrumbEntry[];
  environment: 'development' | 'production';
}

export interface BreadcrumbEntry {
  timestamp: number;
  action: string;
  details?: Record<string, any>;
}

export interface ErrorReportingConfig {
  /**
   * Optional Sentry DSN. When set, the service knows a remote error
   * tracking backend is available. The actual Sentry SDK integration
   * would replace the `sendToServer` call in a future migration.
   */
  dsn: string | null;
}

class ErrorReportingService {
  private breadcrumbs: BreadcrumbEntry[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  private userId?: string;
  private isProduction: boolean;
  private config: ErrorReportingConfig = { dsn: null };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
    this.setupGlobalErrorHandlers();
  }

  /**
   * Update runtime configuration (DSN, etc.).
   * Called by the public API `init()` function.
   */
  configure(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for error tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear user ID
   */
  clearUserId(): void {
    this.userId = undefined;
  }

  /**
   * Add a breadcrumb entry
   */
  addBreadcrumb(action: string, details?: Record<string, any>): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      action,
      details,
    });

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): BreadcrumbEntry[] {
    return [...this.breadcrumbs];
  }

  /**
   * Report an error
   */
  async reportError(error: any, context?: Record<string, any>): Promise<ErrorReport> {
    const report = this.createErrorReport(error, context);

    // Always log to the structured logger — this feeds the in-memory transport,
    // the HTTP transport (if configured), and the console via Pino.
    logger.error('Error Report', {
      context: {
        ...report,
        hasDsn: !!this.config.dsn,
        isProduction: this.isProduction,
      },
      error,
    });

    // In production, also send to the server-side reporting endpoint for
    // persistent storage with PII redaction and rate limiting.
    if (this.isProduction) {
      await this.sendToServer(report);
    }

    return report;
  }

  /**
   * Create a detailed error report
   */
  private createErrorReport(error: any, context?: Record<string, any>): ErrorReport {
    const errorData = formatErrorForLogging(error);

    return {
      id: `${this.sessionId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      errorData: {
        ...errorData,
        context,
      },
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      breadcrumbs: this.getBreadcrumbs(),
      environment: this.isProduction ? 'production' : 'development',
    };
  }

  /**
   * Send error report to server
   */
  private async sendToServer(report: ErrorReport): Promise<void> {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        logger.warn('Failed to send error report', { status: response.statusText });
      }
    } catch (err) {
      logger.error('Error sending error report', { error: err });
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addBreadcrumb('unhandledRejection', {
        reason: event.reason?.message || String(event.reason),
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.addBreadcrumb('globalError', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    });
  }

  /**
   * Report performance metrics
   */
  reportMetric(name: string, value: number, unit?: string): void {
    this.addBreadcrumb('metric', {
      name,
      value,
      unit: unit || 'ms',
    });
  }

  /**
   * Report user action
   */
  reportUserAction(action: string, details?: Record<string, any>): void {
    this.addBreadcrumb('userAction', {
      action,
      ...details,
    });
  }

  /**
   * Create error analytics summary
   */
  getAnalyticsSummary(): {
    sessionId: string;
    totalErrors: number;
    errorTypes: Record<string, number>;
    mostRecentError?: {
      timestamp: string;
      type: string;
      message: string;
    };
  } {
    const errorBreadcrumbs = this.breadcrumbs.filter(
      (b) => b.action === 'globalError' || b.action === 'unhandledRejection',
    );

    const errorTypes: Record<string, number> = {};
    errorBreadcrumbs.forEach((breadcrumb) => {
      const type = breadcrumb.details?.type || breadcrumb.action;
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    return {
      sessionId: this.sessionId,
      totalErrors: errorBreadcrumbs.length,
      errorTypes,
      mostRecentError:
        errorBreadcrumbs.length > 0
          ? {
              timestamp: new Date(
                errorBreadcrumbs[errorBreadcrumbs.length - 1].timestamp,
              ).toISOString(),
              type: errorBreadcrumbs[errorBreadcrumbs.length - 1].action,
              message: String(errorBreadcrumbs[errorBreadcrumbs.length - 1].details?.message || ''),
            }
          : undefined,
    };
  }
}

// Export singleton instance
export const errorReportingService = new ErrorReportingService();
