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

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

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
        <span className="inline-flex items-center gap-2">
          <Spinner className={spinnerClassName} />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default SubmitButton;
