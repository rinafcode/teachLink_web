'use client';

import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { RefreshCw, X } from 'lucide-react';

export const AppUpdateManager: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
  const [show, setShow] = React.useState(true);

  if (!updateAvailable || !show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white p-4 rounded-lg shadow-2xl z-[9999] animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <RefreshCw className="w-5 h-5 animate-spin-slow" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Update Available</h4>
          <p className="text-xs text-blue-100 mt-1">
            A new version of TeachLink is available with new features and improvements.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={updateApp}
              className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-3 py-1.5 bg-blue-500/50 text-white text-xs font-medium rounded hover:bg-blue-500 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShow(false)}
          className="p-1 hover:bg-blue-500 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
