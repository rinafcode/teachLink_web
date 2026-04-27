'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap, useScreenReaderAnnouncement } from '@/hooks/useAccessibility';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Additional class names for the inner panel */
  className?: string;
}

/**
 * Accessible modal dialog with focus trap, Escape-to-close, and screen reader announcements.
 * Uses the existing `useFocusTrap` hook from `useAccessibility`.
 */
export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
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
      if (e.key === 'Escape') onClose();
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
        onClick={onClose}
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
          className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-900 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </>
  );
}
