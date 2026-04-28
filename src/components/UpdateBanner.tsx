'use client';

import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdate, onDismiss }) => (
  <div
    role="alert"
    aria-live="polite"
    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white p-4 rounded-lg shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 duration-300"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 bg-blue-500 rounded-lg shrink-0">
        <RefreshCw className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">Update Available</h4>
        <p className="text-xs text-blue-100 mt-1">
          A new version of TeachLink is ready. Refresh to get the latest features.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onUpdate}
            className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded hover:bg-blue-50 transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 bg-blue-500/50 text-white text-xs font-medium rounded hover:bg-blue-500 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss update notification"
        className="p-1 hover:bg-blue-500 rounded-full transition-colors shrink-0"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
);
