'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { CardSkeleton, ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { OfflineStatusIndicator } from '@/components/offline/OfflineStatusIndicator';
import { DownloadManager } from '@/components/offline/DownloadManager';
import { useInternationalization } from '@/hooks/useInternationalization';
import { SidebarNavigation } from '@/components/navigation/SidebarNavigation';
import { AnalyticsErrorDisplay } from '@/components/dashboard/AnalyticsErrorDisplay';
import { useAnalyticsErrorTracking } from '@/hooks/useAnalyticsErrorTracking';

export default function Dashboard() {
  const { isLoading, errors, hasErrors, dismissError, clearAllErrors } = useDashboardData();
  const { t } = useInternationalization();

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
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                  {t('dashboard.learningProgress')}
                </h2>

                <div className="space-y-8">
                  <div className="border-s-4 border-blue-500 ps-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Web3 UX Design Principles
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dashboard.progressStatus', { percent: 68, remaining: '12h' })}
                    </p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '68%' }}
                      />
                    </div>
                  </div>

                  <div className="border-s-4 border-green-500 ps-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                      Smart Contract Security
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dashboard.progressStatus', { percent: 45, remaining: '18h' })}
                    </p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '45%' }}
                      />
                    </div>
                  </div>

                  <div className="border-s-4 border-purple-500 ps-6 group">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      Scaling DAPps on Starknet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('dashboard.progressStatus', { percent: 12, remaining: '32h' })}
                    </p>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '12%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
