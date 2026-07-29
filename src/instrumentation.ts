/**
 * Next.js Instrumentation Entry Point
 *
 * This file is loaded exactly once on the server when the Next.js app starts.
 * It is the ideal place to initialise cross-cutting concerns such as error
 * tracking, performance monitoring, and structured logging.
 *
 * Next.js automatically detects `src/instrumentation.ts` (or
 * `instrumentation.ts` at the project root) when
 * `experimental.instrumentationHook` is enabled in `next.config.ts`.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { init as initErrorTracking } from '@/lib/errors';

// Sentry DSN — set NEXT_PUBLIC_SENTRY_DSN (client + server) or SENTRY_DSN
// (server-only) in your environment. When unset, error tracking still works
// locally via the structured logger and in-memory transport.
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined;

/**
 * Register all instrumentation hooks.
 *
 * `register()` runs on the server during startup. Code here should be
 * lightweight and side-effect-free beyond configuration.
 */
export function register() {
  // Initialise the error tracking system with the configured DSN.
  // This sets up global error handlers, configures the reporting service,
  // and enables structured error logging.
  initErrorTracking(SENTRY_DSN);

  // Log startup so the structured logger captures the boot event.
  const { createLogger } = require('@/lib/logging');
  const logger = createLogger('instrumentation');
  logger.info('Application instrumentation complete', {
    context: {
      environment: process.env.NODE_ENV,
      hasSentryDsn: !!SENTRY_DSN,
      edgeRegion: process.env.EDGE_REGION || 'default',
    },
  });
}

/**
 * Optional: report errors that occur during server component rendering.
 * This hook is called when an error happens during the React render cycle
 * on the server.
 */
export async function onError(error: unknown) {
  const { captureException } = await import('@/lib/errors');
  captureException(error, {
    extra: { source: 'server-render' },
  });
}
