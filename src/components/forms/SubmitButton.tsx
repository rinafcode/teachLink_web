'use client';

/**
 * SubmitButton
 *
 * A polymorphic submit button that shows a loading spinner and disables itself
 * when `isLoading` is true, preventing double-submission at the UI layer.
 *
 * Usage:
 *   <SubmitButton isLoading={mutation.isLoading} loadingText="Saving…">
 *     Save Changes
 *   </SubmitButton>
 */

import React from 'react';
import { AccessibleLoading } from '../../app/components/accessibility/ScreenReaderOptimizer';

// ─── Spinner ──────────────────────────────────────────────────────────────────



// ─── Props ────────────────────────────────────────────────────────────────────

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Pass the `isLoading` value from `useMutation` (or any boolean). */
  isLoading?: boolean;
  /**
   * Text shown next to the spinner during loading.
   * Defaults to `"Loading…"` when not supplied.
   */
  loadingText?: string;
  /** Size of the spinner. Defaults to `"h-4 w-4"`. */
  spinnerClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading = false,
  loadingText = 'Loading…',
  spinnerClassName = 'h-4 w-4',
  children,
  disabled,
  className = '',
  type = 'submit',
  ...props
}) => {
  const isDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <AccessibleLoading
          isLoading={isLoading}
          message={loadingText}
          className="inline-flex items-center justify-center gap-2"
          spinnerClassName={`animate-spin rounded-full border-b-2 border-current ${spinnerClassName}`}
          showText={true}
        />
      ) : (
        children
      )}
    </button>
  );
};

export default SubmitButton;
