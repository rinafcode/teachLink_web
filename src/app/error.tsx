'use client';

import React, { useEffect } from 'react';
import UserFriendlyErrorDisplay from '@/components/errors/UserFriendlyErrorDisplay';
import { errorReportingService } from '@/services/errorReporting';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorReportingService.addBreadcrumb('error.tsx', {
      errorMessage: error.message,
      digest: error.digest,
    });
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <UserFriendlyErrorDisplay
        error={error}
        title="Something went wrong!"
        onRetry={reset}
        // Only show stack traces in development
        showDetails={process.env.NODE_ENV === 'development'}
        severity="error"
      />
    </div>
  );
}