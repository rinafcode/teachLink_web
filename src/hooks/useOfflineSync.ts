'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage offline state and handle background/foreground syncing when connectivity returns
 */
export function useOfflineSync(syncCallback?: () => Promise<void>) {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Initial offline check
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isOffline) return;
    
    setIsSyncing(true);
    try {
      // Fire local UI-bound sync callback if provided
      if (syncCallback) await syncCallback();

      // Register native background sync via service worker (for seamless mobile PWA)
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - SyncManager is not fully typed in all TS DOM libs yet
        await registration.sync.register('teachlink-offline-sync');
      }
      
      setLastSynced(new Date());
    } catch (error) {
      console.error('Offline synchronization failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, syncCallback]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); triggerSync(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [triggerSync]);

  return { isOffline, isSyncing, lastSynced, triggerSync };
}