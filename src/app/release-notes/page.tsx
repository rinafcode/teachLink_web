import React, { lazy } from 'react';
import LazyLoadingManager from '@/components/performance/LazyLoadingManager';

const LazyReleaseNotes = lazy(() => import('@/components/shared/ReleaseNotes'));

export default function ReleaseNotesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
          What's New in TeachLink
        </h1>
        <LazyLoadingManager componentName="ReleaseNotes">
          <LazyReleaseNotes />
        </LazyLoadingManager>
      </div>
    </div>
  );
}
