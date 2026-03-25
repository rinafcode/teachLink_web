'use client';

import React, { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { AppUpdateManager } from './AppUpdateManager';
import { OfflineSyncManager } from './OfflineSyncManager';
import { NativeIntegrationLayer } from './NativeIntegrationLayer';

export const PWAManager: React.FC = () => {
  const { registerServiceWorker, isOffline } = usePWA();

  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  return (
    <>
      <AppUpdateManager />
      <OfflineSyncManager />
      <NativeIntegrationLayer />
      
      {/* Offline Status Toast */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-700 shadow-xl z-[9999] animate-in fade-in zoom-in duration-300">
          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" />
          Offline Mode
        </div>
      )}
    </>
  );
};
