'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * General Loading component intended for use with React Suspense or as a page-level loader.
 */
export const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 animate-in fade-in duration-500">
      <LoadingSpinner size={40} label="Loading amazing content..." />
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl opacity-50 grayscale">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
};
