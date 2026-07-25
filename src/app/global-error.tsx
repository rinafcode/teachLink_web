'use client';

import React, { useEffect } from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';
import { captureException, addBreadcrumb } from '@/lib/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error through the structured error tracking system
    addBreadcrumb({
      category: 'global-error',
      message: error.message,
      data: { digest: error.digest },
      level: 'error',
    });
    captureException(error, {
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
          <UserFriendlyErrorDisplay
            error={error}
            title="A critical error occurred."
            onRetry={reset}
            showDetails={process.env.NODE_ENV === 'development'}
            severity="error"
          />
        </div>
      </body>
    </html>
  );
}
