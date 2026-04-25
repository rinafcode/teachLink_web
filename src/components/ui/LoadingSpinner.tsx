'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  label?: string;
  fullPage?: boolean;
}

/**
 * Standardized Loading Spinner component.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  className = '',
  label,
  fullPage = false,
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={size} />
      {label && (
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
