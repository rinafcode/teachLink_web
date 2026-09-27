'use client';

import { useState } from 'react';
import type { TrackedError } from '@/hooks/useAnalyticsErrorTracking';

interface AnalyticsErrorDisplayProps {
  errors: TrackedError[];
  onDismiss: (errorId: string) => void;
  onClearAll: () => void;
  onRetry?: () => void;
  maxDisplayed?: number;
}

export const AnalyticsErrorDisplay = ({
  errors,
  onDismiss,
  onClearAll,
  onRetry,
  maxDisplayed = 3,
}: AnalyticsErrorDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (errors.length === 0) return null;

  const displayedErrors = isExpanded ? errors : errors.slice(-maxDisplayed);
  const hiddenCount = errors.length - maxDisplayed;

  const getErrorSeverity = (type: string) => {
    if (type.includes('CONNECTION') || type.includes('FETCH')) return 'error';
    if (type.includes('PROCESSING') || type.includes('SYNC')) return 'warning';
    return 'info';
  };

  const getErrorColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {displayedErrors.map((error) => {
        const severity = getErrorSeverity(error.type);
        return (
          <div
            key={error.id}
            className={`p-4 rounded-lg border ${getErrorColor(
              severity,
            )} flex items-start gap-3 transition-all`}
          >
            <div className="flex-shrink-0 mt-0.5">{getErrorIcon(severity)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{error.type}</p>
              <p className="text-sm mt-1 opacity-90">{error.message}</p>
              <p className="text-xs mt-2 opacity-75">
                {new Date(error.timestamp).toLocaleTimeString()}
                {error.context.panelId && ` • Panel: ${error.context.panelId}`}
              </p>
            </div>
            <button
              onClick={() => onDismiss(error.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        );
      })}

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {hiddenCount > 0 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Show {hiddenCount} more error{hiddenCount > 1 ? 's' : ''}
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Show less
            </button>
          )}
          {errors.length > 1 && (
            <button
              onClick={onClearAll}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalyticsErrorDisplay;
