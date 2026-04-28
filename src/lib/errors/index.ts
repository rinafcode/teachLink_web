/**
 * Error Tracking Integration (#327)
 *
 * Wires a Sentry-compatible interface over the existing errorReportingService.
 * Drop-in: swap the stub init() for a real Sentry.init() call when the SDK
 * is installed, without changing any call-sites.
 */

import { errorReportingService, BreadcrumbEntry } from '@/services/errorReporting';

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
// `@sentry/nextjs` is installed.

let _initialized = false;

/**
 * Initialise the error tracking SDK.
 * Call once at application startup (e.g. in instrumentation.ts).
 */
export function init(dsn?: string): void {
  if (_initialized) return;
  _initialized = true;

  // TODO: replace with Sentry.init({ dsn, ... }) when SDK is installed.
  if (dsn) {
    console.info('[ErrorTracking] Initialised with DSN:', dsn);
  }

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

// Re-export the underlying service for advanced use-cases.
export { errorReportingService };
