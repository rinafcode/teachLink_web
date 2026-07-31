'use client';

import { useEffect } from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';
import { errorReportingService } from '@/services/errorReporting';
import { createLogger } from '@/lib/logging';

const logger = createLogger('MessagesError');

interface MessagesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MessagesError({ error, reset }: MessagesErrorProps) {
  useEffect(() => {
    errorReportingService.addBreadcrumb('messages/error.tsx', {
      errorMessage: error.message,
      digest: error.digest,
    });
    errorReportingService.reportError(error, {
      errorInfo: { componentStack: '' },
      ...(error.digest ? { digest: error.digest } : {}),
    });
    logger.error('Messages page error', { error });
  }, [error]);

  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center p-4">
      <UserFriendlyErrorDisplay
        error={error}
        title="Unable to load messages"
        onRetry={reset}
        showDetails={process.env.NODE_ENV === 'development'}
        severity="error"
      />
    </div>
  );
}
