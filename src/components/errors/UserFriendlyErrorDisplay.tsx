'use client';

/**
 * User-Friendly Error Display Component
 * Presents errors to users with clear messages and actionable solutions
 */

import React, { useEffect, useState } from 'react';
import { ErrorType, getUserFriendlyMessage, getActionSuggestion, classifyError } from '@/utils/errorUtils';

export interface ErrorDisplayProps {
  error?: any;
  title?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  severity?: 'error' | 'warning' | 'info';
  autoHideDuration?: number;
}

const severityStyles: Record<'error' | 'warning' | 'info', { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: '⚠️',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: '⚡',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'ℹ️',
  },
};

export const UserFriendlyErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  onDismiss,
  onRetry,
  showDetails = false,
  severity = 'error',
  autoHideDuration,
}) => {
  const [isVisible, setIsVisible] = useState(!!error);
  const [showingDetails, setShowingDetails] = useState(false);

  useEffect(() => {
    setIsVisible(!!error);

    if (error && autoHideDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, autoHideDuration, onDismiss]);

  if (!isVisible || !error) return null;

  const errorInfo = classifyError(error);
  const userMessage = getUserFriendlyMessage(error);
  const actionSuggestion = getActionSuggestion(error);
  const styles = severityStyles[severity as keyof typeof severityStyles];

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleToggleDetails = () => {
    setShowingDetails(!showingDetails);
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-1">{styles.icon}</span>

        <div className="flex-1 min-w-0">
          {title && <h3 className="font-semibold text-lg mb-1">{title}</h3>}

          <p className="text-sm leading-relaxed mb-2">{userMessage}</p>

          {/* Action Suggestion */}
          {actionSuggestion && (
            <p className="text-xs opacity-75 mb-3">💡 {actionSuggestion}</p>
          )}

          {/* Details Section */}
          {showDetails && (
            <>
              <button
                onClick={handleToggleDetails}
                className={`text-xs underline ${styles.text} opacity-75 hover:opacity-100 mb-2`}
              >
                {showingDetails ? 'Hide' : 'Show'} Details
              </button>

              {showingDetails && (
                <details className="mt-2 text-xs opacity-75 cursor-pointer">
                  <summary className="mb-1">Error Information</summary>
                  <pre className="bg-black bg-opacity-5 p-2 rounded overflow-auto max-h-48 text-xs">
                    {JSON.stringify(
                      {
                        type: errorInfo.type,
                        message: errorInfo.message,
                        statusCode: errorInfo.statusCode,
                        timestamp: new Date(errorInfo.timestamp).toISOString(),
                        retryable: errorInfo.retryable,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {onRetry && errorInfo.retryable && (
              <button
                onClick={onRetry}
                className={`px-3 py-1 rounded text-sm font-medium bg-white bg-opacity-20 hover:bg-opacity-30 transition-all`}
                aria-label="Retry action"
              >
                🔄 Retry
              </button>
            )}

            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={`px-3 py-1 rounded text-sm font-medium bg-white bg-opacity-20 hover:bg-opacity-30 transition-all`}
                aria-label="Dismiss error"
              >
                ✕ Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-xl leading-none opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label="Close error message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Multiple Errors Display Component
 */
export interface MultipleErrorsDisplayProps {
  errors: any[];
  onDismiss?: (index: number) => void;
  onRetry?: (index: number) => void;
  maxVisible?: number;
}

export const MultipleErrorsDisplay: React.FC<MultipleErrorsDisplayProps> = ({
  errors,
  onDismiss,
  onRetry,
  maxVisible = 3,
}: MultipleErrorsDisplayProps) => {
  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, errors.length - maxVisible);

  return (
    <div className="space-y-2">
      {visibleErrors.map((error, index) => (
        <UserFriendlyErrorDisplay
          key={index}
          error={error}
          onDismiss={() => onDismiss?.(index)}
          onRetry={() => onRetry?.(index)}
          severity="error"
        />
      ))}

      {hiddenCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 rounded-lg p-3 text-sm">
          + {hiddenCount} more {hiddenCount === 1 ? 'error' : 'errors'}
        </div>
      )}
    </div>
  );
};

/**
 * Inline Error Component (for form fields)
 */
export interface InlineErrorProps {
  error?: any;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, className = '' }: InlineErrorProps) => {
  if (!error) return null;

  const userMessage = getUserFriendlyMessage(error);

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`} role="alert">
      {userMessage}
    </p>
  );
};

/**
 * Error Notification Toast Component
 */
export interface ErrorToastProps {
  error?: any;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  autoHideDuration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  position = 'top',
  autoHideDuration = 5000,
}: ErrorToastProps) => {
  const [isVisible, setIsVisible] = useState(!!error);

  useEffect(() => {
    setIsVisible(!!error);

    if (error && autoHideDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, autoHideDuration, onDismiss]);

  if (!isVisible || !error) return null;

  const userMessage = getUserFriendlyMessage(error);
  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4';

  return (
    <div
      className={`fixed ${positionClasses} right-4 bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm animate-in fade-in slide-in-from-right-2`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{userMessage}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="text-lg leading-none opacity-75 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default UserFriendlyErrorDisplay;
