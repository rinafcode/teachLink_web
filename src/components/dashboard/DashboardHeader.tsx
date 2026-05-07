import React from 'react';
import { BarChart2, Download, Share2, CheckCheck } from 'lucide-react';

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
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-600 text-white">
          <BarChart2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Interactive data visualization &amp; real-time insights
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Export all */}
        <button
          onClick={onExportAll}
          aria-label="Export all panels as CSV"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export All
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          aria-label="Copy shareable dashboard link"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {shareSuccess ? (
            <>
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Share
            </>
          )}
        </button>
      </div>
    </div>
  );
};
