'use client';

import { useState } from 'react';
import { useConsentStore } from '@/lib/consent/store';
import { CookiePreferencesModal } from './CookiePreferencesModal';

/**
 * Bottom-of-screen cookie consent banner.
 * Shown only when the user has not yet made a valid consent decision.
 * Renders nothing on the server (ssr: false via dynamic import in RootProviders).
 */
export function CookieConsentBanner() {
  const decided = useConsentStore((s) => s.decided);
  const isConsentValid = useConsentStore((s) => s.isConsentValid);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);
  const [showPreferences, setShowPreferences] = useState(false);

  // Hide banner once a valid decision exists
  if (decided && isConsentValid()) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Cookie consent"
        aria-live="polite"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:px-6"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We use cookies to improve your experience. Necessary cookies are always active.{' '}
            <button
              onClick={() => setShowPreferences(true)}
              className="underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-blue-400"
            >
              Manage preferences
            </button>
          </p>

          <div className="flex shrink-0 gap-2">
            <button
              onClick={rejectAll}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reject optional
            </button>
            <button
              onClick={acceptAll}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      <CookiePreferencesModal isOpen={showPreferences} onClose={() => setShowPreferences(false)} />
    </>
  );
}
