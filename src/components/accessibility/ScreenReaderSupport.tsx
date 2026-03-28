'use client';

import { RefObject, useEffect } from 'react';

interface ScreenReaderSupportProps {
  politeRef: RefObject<HTMLDivElement | null>;
  assertiveRef: RefObject<HTMLDivElement | null>;
  /** Visually hidden page summary for first paint (optional) */
  pageLabel?: string;
}

/**
 * Mounts persistent ARIA live regions so announcements are reliable across the session.
 * WCAG 4.1.3 — Status messages must be programmatically determinable without focus change.
 */
export function ScreenReaderSupport({
  politeRef,
  assertiveRef,
  pageLabel,
}: ScreenReaderSupportProps) {
  useEffect(() => {
    if (!pageLabel || typeof document === 'undefined') return;
    const main = document.querySelector('main');
    if (main && !main.getAttribute('aria-label') && !main.getAttribute('aria-labelledby')) {
      main.setAttribute('aria-label', pageLabel);
    }
  }, [pageLabel]);

  return (
    <>
      {pageLabel ? (
        <p id="app-page-summary" className="sr-only">
          {pageLabel}
        </p>
      ) : null}
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-relevant="additions text"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
