'use client';

import React, { useEffect } from 'react';
import { useFocusTrap, useScreenReaderAnnouncement } from '@/hooks/useAccessibility';
import { X } from 'lucide-react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Example of an accessible modal dialog with focus trap,
 * keyboard navigation, and proper ARIA attributes
 */
export function AccessibleModalExample({
  isOpen,
  onClose,
  title,
  children,
}: AccessibleModalProps) {
  const containerRef = useFocusTrap(isOpen);
  const announce = useScreenReaderAnnouncement();

  useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`, 'polite');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announce]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={containerRef as any}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Example usage component
 */
export function ModalExampleUsage() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Accessible Modal Example</h1>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Open Modal
      </button>

      <AccessibleModalExample
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Dialog"
      >
        <p className="mb-4">
          This is an accessible modal dialog with proper focus management and keyboard navigation.
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>Focus is trapped within the modal</li>
          <li>Press Escape to close</li>
          <li>Tab cycles through focusable elements</li>
          <li>Screen readers announce the dialog</li>
          <li>Background is not scrollable</li>
        </ul>
      </AccessibleModalExample>
    </div>
  );
}
