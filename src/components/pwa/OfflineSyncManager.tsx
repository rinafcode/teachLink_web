'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const OfflineSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Listen for custom sync events from service worker if needed
    // In a real app, we'd use the SyncManager API or a shared state (Zustand/Context)
    // For now, we'll listen for a custom event
    const handleSyncEvent = (e: any) => {
      setSyncStatus(e.detail.status);
      setShow(true);
      if (e.detail.status === 'synced') {
        setTimeout(() => setShow(false), 3000);
      }
    };

    window.addEventListener('pwa-sync-status', handleSyncEvent);
    return () => window.removeEventListener('pwa-sync-status', handleSyncEvent);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg shadow-lg z-[9998] flex items-center gap-3 animate-in slide-in-from-right-5">
      {syncStatus === 'syncing' && (
        <>
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin-slow" />
          <span className="text-sm font-medium">Synchronizing data...</span>
        </>
      )}
      {syncStatus === 'synced' && (
        <>
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">Data synchronized</span>
        </>
      )}
      {syncStatus === 'error' && (
        <>
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium">Sync failed</span>
        </>
      )}
    </div>
  );
};
