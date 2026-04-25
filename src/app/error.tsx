'use client';
import React, { useEffect } from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';
import { errorReportingService } from '@/services/errorReporting';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
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
        showDetails={process.env.NODE_ENV === 'development'}
        severity="error"
      />
    </div>
  );
}
