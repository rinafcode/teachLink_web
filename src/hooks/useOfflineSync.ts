'use client';

import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logging';
import { SyncConflict } from '@/services/offlineSync';

const logger = createLogger('use-offline-sync');

/** Deterministic conflict state surfaced to the UI by the offline hooks. */
export interface ConflictState {
  pending: number;
  conflicted: number;
  resolved: number;
}

export interface OfflineSyncStatusSnapshot extends ConflictState {
  deadLetter: number;
}

/** Message posted by the service worker when a background sync fires. */
export const OFFLINE_SYNC_REQUESTED = 'OFFLINE_SYNC_REQUESTED';

/**
 * Hook to manage offline state and handle background/foreground syncing when
 * connectivity returns. Exposes the deterministic `pending` / `conflicted` /
 * `resolved` conflict state consumed by the `ConflictResolver` component.
 *
 * @param syncCallback   Invoked (online only) whenever a sync is triggered.
 * @param getStatus      Optional provider returning live conflict/dead-letter
 *                       counts from the offline stores (e.g. useOfflineMode's
 *                       getSyncStatus). When omitted the states stay at zero.
 */
export function useOfflineSync(
  syncCallback?: () => Promise<void>,
  getStatus?: () => Promise<OfflineSyncStatusSnapshot>,
) {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState>({
    pending: 0,
    conflicted: 0,
    resolved: 0,
  });
  const [deadLetterCount, setDeadLetterCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // Initial offline check
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
  }, []);

  /** Refreshes the deterministic conflict state from the offline stores. */
  const refreshStatus = useCallback(async () => {
    if (!getStatus) return;
    try {
      const status = await getStatus();
      setConflictState({
        pending: status.pending,
        conflicted: status.conflicted,
        resolved: status.resolved,
      });
      setDeadLetterCount(status.deadLetter);
    } catch (error) {
      logger.error('Failed to refresh offline sync status', { error });
    }
  }, [getStatus]);

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
      await refreshStatus();
    } catch (error) {
      logger.error('Offline synchronization failed', { error });
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, syncCallback, refreshStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      triggerSync();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Service worker background sync: drain the offline queue when connectivity
  // returns even if the tab is backgrounded.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === OFFLINE_SYNC_REQUESTED) {
        triggerSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [triggerSync]);

  return {
    isOffline,
    isSyncing,
    lastSynced,
    triggerSync,
    refreshStatus,
    conflictState,
    deadLetterCount,
    conflicts,
  };
}
