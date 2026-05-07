'use client';

import React, { RefObject, useEffect, useId } from 'react';

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
    if (typeof document === 'undefined') return;
    const main = document.querySelector('main');
    if (!main) return;
    const priorId = main.getAttribute('id');
    const priorRole = main.getAttribute('role');

    if (!priorId) {
      main.setAttribute('id', 'main-content');
    }
    if (!priorRole) {
      main.setAttribute('role', 'main');
    }

    return () => {
      if (!priorId && main.getAttribute('id') === 'main-content') {
        main.removeAttribute('id');
      }
      if (!priorRole && main.getAttribute('role') === 'main') {
        main.removeAttribute('role');
      }
    };
  }, []);

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
        ref={politeRef as React.Ref<HTMLDivElement>}
        role="status"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef as React.Ref<HTMLDivElement>}
        role="alert"
        aria-live="assertive"
        aria-relevant="additions text"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
