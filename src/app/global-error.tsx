'use client';

import React, { useEffect } from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';
import { errorReportingService } from '@/services/errorReporting';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorReportingService.addBreadcrumb('global-error', {
      errorMessage: error.message,
      digest: error.digest,
    });
    errorReportingService.reportError(error);
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
