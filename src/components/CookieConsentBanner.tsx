'use client';

import { useEffect, useRef, useId } from 'react';
import { Shield } from 'lucide-react';
import { useGdprConsent } from '@/hooks/useGdprConsent';
import { useScreenReaderAnnouncement } from '@/hooks/useAccessibility';

/**
 * GDPR Cookie Consent Banner with full focus management:
 * - Traps focus inside the banner while visible
 * - Restores focus to the previously focused element on dismiss
 * - Announces appearance to screen readers
 * - Keyboard: Tab/Shift+Tab cycle within banner; Enter/Space activate buttons
 */
export function CookieConsentBanner() {
  const { showBanner, accept, reject } = useGdprConsent();
  const bannerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announce = useScreenReaderAnnouncement();
  const titleId = useId();

  // Save the element that had focus before the banner appeared, then focus the banner
  useEffect(() => {
    if (!showBanner) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    announce('Cookie consent banner appeared. Please choose your cookie preferences.', 'assertive');

    // Focus the first interactive element inside the banner
    const raf = requestAnimationFrame(() => {
      const first = bannerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [showBanner, announce]);

  // Restore focus when banner is dismissed
  useEffect(() => {
    if (showBanner) return;
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [showBanner]);

  // Trap focus inside the banner while it is visible
  useEffect(() => {
    if (!showBanner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !bannerRef.current) return;

      const focusable = Array.from(
        bannerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-desc`}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Shield
            size={20}
            className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <div>
            <p id={titleId} className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Cookie Preferences
            </p>
            <p id={`${titleId}-desc`} className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              We use cookies to improve your experience. You can accept all cookies or reject
              non-essential ones.{' '}
              <a
                href="/privacy"
                className="underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-blue-400"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
