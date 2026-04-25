'use client';

import React from 'react';
import { UserFriendlyErrorDisplay } from '@/components/errors/UserFriendlyErrorDisplay';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
