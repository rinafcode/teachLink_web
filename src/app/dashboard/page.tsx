'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { OfflineStatusIndicator } from '@/components/offline/OfflineStatusIndicator';
import { DownloadManager } from '@/components/offline/DownloadManager';
import { SidebarNavigation } from '@/components/navigation/SidebarNavigation';
import { AnalyticsErrorDisplay } from '@/components/dashboard/AnalyticsErrorDisplay';
import { LearningProgressList } from '@/app/components/dashboard/LearningProgressList';

export default function Dashboard() {
  const { hasErrors, errors, dismissError, clearAllErrors } = useDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="no-print bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <OfflineStatusIndicator />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasErrors && (
          <AnalyticsErrorDisplay
            errors={errors}
            onDismiss={dismissError}
            onClearAll={clearAllErrors}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <LearningProgressList />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <SidebarNavigation />
          </div>
        </div>
      </div>

      <DownloadManager />
    </div>
  );
}
