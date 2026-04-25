'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateAppEnv } from '@/utils/web3/envValidation';

interface EnvGuardProps {
  children: React.ReactNode;
}

/**
 * EnvGuard - Validates environment variables on mount and prevents app from running if they are missing.
 */
export const EnvGuard: React.FC<EnvGuardProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = validateAppEnv();
    if (!result.success) {
      setError(result.error || 'A critical configuration error was detected.');
    }
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{error}</p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Please check your{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-red-600">
                .env
              </code>{' '}
              file and ensure all required variables are set correctly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-200 dark:shadow-none"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
