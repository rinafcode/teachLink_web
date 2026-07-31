'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap, useScreenReaderAnnouncement } from '@/hooks/useAccessibility';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

/** How the modal came to be closed. Optional so existing `() => void` handlers keep working. */
export type ModalCloseReason = 'escape' | 'backdrop' | 'button';

export interface ModalProps {
  isOpen: boolean;
  onClose: (reason?: ModalCloseReason) => void;
  title: string;
  children: React.ReactNode;
  /** Controls the maximum width of the modal panel */
  size?: ModalSize;
  /** Additional class names for the inner panel */
  className?: string;
}

/**
 * Accessible modal dialog with focus trap, Escape-to-close, and screen reader announcements.
 * Uses the existing `useFocusTrap` hook from `useAccessibility`.
 *
 * `onClose` now receives an optional reason ('escape' | 'backdrop' | 'button')
 * so consumers that need to distinguish an ambient dismiss gesture from an
 * explicit close action can do so — see `ModalFeedbackLoop`, which uses this
 * to make Escape/backdrop always cancel outright instead of interrupting the
 * user with a feedback prompt. Existing `() => void` handlers are unaffected;
 * they simply ignore the extra argument.
 *
 * NOTE on native `<dialog>`: this was evaluated as a follow-up (native
 * top-layer stacking, a real `::backdrop`, built-in inertness of background
 * content) but jsdom 26, which this repo's Vitest suite runs on, does not
 * implement `HTMLDialogElement.showModal()`/`close()` — every test that
 * renders a Modal (this file's suite, plus any test touching the 9 current
 * consumers) would throw immediately. Revisit once the test environment
 * upgrades to a jsdom version with dialog support, or the suite moves to a
 * real-browser runner (e.g. Playwright component tests) for this component.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  const titleId = useId();
  const containerRef = useFocusTrap(isOpen);
  const announce = useScreenReaderAnnouncement();

  // Announce open/close and lock body scroll
  useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`, 'polite');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announce]);

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose('escape');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onClose('backdrop')}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className={`relative w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-900 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {title}
            </h2>
            <button
              onClick={() => onClose('button')}
              aria-label="Close dialog"
              className="rounded p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <ErrorBoundary isolationId="modal-dialog" isolationLevel="component">
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}