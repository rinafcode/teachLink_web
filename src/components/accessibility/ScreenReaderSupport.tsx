'use client';

import { RefObject, useEffect, useId } from 'react';

interface ScreenReaderSupportProps {
  politeRef: RefObject<HTMLDivElement | null>;
  assertiveRef: RefObject<HTMLDivElement | null>;
  /** Visually hidden app name / scope; linked from `<main>` when it has no other label */
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
  const mainLabelId = useId();

  useEffect(() => {
    if (!pageLabel || typeof document === 'undefined') return;
    const main = document.querySelector('main');
    if (!main) return;
    if (main.getAttribute('aria-label') || main.getAttribute('aria-labelledby')) return;

    main.setAttribute('aria-labelledby', mainLabelId);
    return () => {
      if (main.getAttribute('aria-labelledby') === mainLabelId) {
        main.removeAttribute('aria-labelledby');
      }
    };
  }, [pageLabel, mainLabelId]);

  return (
    <>
      {pageLabel ? (
        <span id={mainLabelId} className="sr-only">
          {pageLabel}
        </span>
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
