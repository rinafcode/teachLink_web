'use client';
import React, { useEffect } from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';
import { captureException, addBreadcrumb } from '@/lib/errors';
import { createLogger } from '@/lib/logging';
const logger = createLogger('ErrorPage');

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error through the structured error tracking system
    addBreadcrumb({
      category: 'error.tsx',
      message: error.message,
      data: { digest: error.digest },
      level: 'error',
    });
    captureException(error, {
      extra: {
        errorInfo: { componentStack: '' },
        ...(error.digest ? { digest: error.digest } : {}),
      },
    });
    logger.error('Application error', { error });
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <UserFriendlyErrorDisplay
        error={error}
        title="Something went wrong!"
        onRetry={reset}
        showDetails={process.env.NODE_ENV === 'development'}
        severity="error"
      />
    </div>
  );
}
