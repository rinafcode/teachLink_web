/**
 * Error Tracking Integration (#327)
 *
 * Enhanced error tracking using existing infrastructure with structured logging,
 * breadcrumbs, and server-side reporting. Provides Sentry-compatible interface
 * for easy migration to Sentry in the future if needed.
 *
 * ## Architecture
 *
 * The error tracking system has three layers:
 *
 * 1. **Public API** (`src/lib/errors/index.ts`) — Sentry-compatible functions
 *    (`init`, `captureException`, `captureMessage`, `addBreadcrumb`, `setUser`,
 *    `getBreadcrumbs`) that application code calls.
 *
 * 2. **ErrorReportingService** (`src/services/errorReporting.ts`) — Singleton
 *    that manages breadcrumbs, session IDs, user identity, and dispatches
 *    error reports to the structured logging system and (in production) the
 *    `/api/errors/report` endpoint.
 *
 * 3. **Structured Logging** (`src/lib/logging`) — Pino-based logger with PII
 *    redaction, correlation IDs, and multi-transport support (in-memory, HTTP).
 *
 * ## Configuration
 *
 * Set `NEXT_PUBLIC_SENTRY_DSN` (or `SENTRY_DSN` on the server) to enable
 * remote error reporting. When no DSN is configured, errors are still logged
 * locally via the structured logger and stored in the in-memory transport.
 *
 * ## Initialization
 *
 * Call `init()` once at application startup via `src/instrumentation.ts`.
 * The instrumentation file is automatically loaded by Next.js.
 */

import { errorReportingService, BreadcrumbEntry } from '@/services/errorReporting';
import { createLogger } from '@/lib/logging';

const logger = createLogger('ErrorTracking');

// ── Types ────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface Breadcrumb {
  category: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}

// ── Sentry-compatible stub ────────────────────────────────────────────────────
// Replace the body of each function with the real Sentry SDK call once
// `@sentry/nextjs` is installed. The current implementation delegates to the
// internal ErrorReportingService which provides structured logging, breadcrumb
// tracking, and server-side reporting.

let _initialized = false;

/**
 * Initialise the error tracking SDK.
 * Call once at application startup (e.g. in instrumentation.ts).
 *
 * @param dsn - Optional Sentry DSN. When provided, error reports are also
 *   sent to the remote Sentry endpoint. When omitted, errors are logged
 *   locally via the structured logger and stored in-memory.
 */
export function init(dsn?: string): void {
  if (_initialized) return;
  _initialized = true;

  logger.info('[ErrorTracking] Initialized with structured error tracking', {
    context: { hasDsn: !!dsn, environment: process.env.NODE_ENV },
  });

  // Configure the DSN on the reporting service so it knows whether to
  // attempt remote delivery.
  errorReportingService.configure({ dsn: dsn ?? null });

  // Forward global unhandled errors to the reporting service automatically.
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason, { extra: { type: 'unhandledRejection' } });
    });
    window.addEventListener('error', (event) => {
      captureException(event.error ?? new Error(event.message), {
        extra: { filename: event.filename, lineno: event.lineno },
      });
    });
  }
}

/**
 * Capture an exception with optional context.
 * Mirrors Sentry.captureException().
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (context?.userId) {
    errorReportingService.setUserId(context.userId);
  }

  addBreadcrumb({
    category: 'exception',
    message: err.message,
    data: { stack: err.stack, ...context?.extra },
    level: 'error',
  });

  errorReportingService.reportError(err, { tags: context?.tags, extra: context?.extra });
}

/**
 * Capture a plain message (non-exception).
 * Mirrors Sentry.captureMessage().
 */
export function captureMessage(message: string, context?: ErrorContext): void {
  addBreadcrumb({ category: 'message', message, level: 'info', data: context?.extra });
  errorReportingService.reportError(new Error(message), context);
}

/**
 * Add a breadcrumb for richer error context.
 * Mirrors Sentry.addBreadcrumb().
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  errorReportingService.addBreadcrumb(breadcrumb.category, {
    message: breadcrumb.message,
    level: breadcrumb.level,
    ...breadcrumb.data,
  });
}

/**
 * Attach user identity to subsequent error reports.
 * Mirrors Sentry.setUser().
 */
export function setUser(user: { id: string; [key: string]: unknown } | null): void {
  if (user) {
    errorReportingService.setUserId(user.id);
    addBreadcrumb({ category: 'user', message: 'User identified', data: { userId: user.id } });
  } else {
    errorReportingService.clearUserId();
  }
}

/**
 * Retrieve current breadcrumbs (useful for diagnostics / tests).
 */
export function getBreadcrumbs(): BreadcrumbEntry[] {
  return errorReportingService.getBreadcrumbs();
}

/**
 * Check whether the error tracking system has been initialized.
 */
export function isInitialized(): boolean {
  return _initialized;
}

/**
 * Reset the initialization state (primarily for testing).
 */
export function _resetForTesting(): void {
  _initialized = false;
}

// Re-export the underlying service for advanced use-cases.
export { errorReportingService };
