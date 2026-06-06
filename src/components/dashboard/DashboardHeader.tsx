import React from 'react';
import { BarChart2, Download, Share2, CheckCheck } from 'lucide-react';
import { useInternationalization } from '@/hooks/useInternationalization';
import { translateWithFallback } from './dashboardI18n';

interface DashboardHeaderProps {
  onExportAll: () => void;
  onShare: () => void;
  shareSuccess: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onExportAll,
  onShare,
  shareSuccess,
}) => {
  const { t } = useInternationalization();

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-600 text-white">
          <BarChart2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {translateWithFallback(t, 'dashboard.analytics.title', 'Analytics Dashboard')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {translateWithFallback(
              t,
              'dashboard.analytics.subtitle',
              'Interactive data visualization and real-time insights',
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Export all */}
        <button
          onClick={onExportAll}
          aria-label={translateWithFallback(
            t,
            'dashboard.analytics.actions.exportAllAria',
            'Export all panels as CSV',
          )}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          {translateWithFallback(t, 'dashboard.analytics.actions.exportAll', 'Export All')}
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          aria-label={translateWithFallback(
            t,
            'dashboard.analytics.actions.shareAria',
            'Copy shareable dashboard link',
          )}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {shareSuccess ? (
            <>
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              {translateWithFallback(t, 'dashboard.analytics.actions.copied', 'Copied!')}
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" aria-hidden="true" />
              {translateWithFallback(t, 'dashboard.analytics.actions.share', 'Share')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
