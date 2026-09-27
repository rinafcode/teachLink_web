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

/**
 * Dead-letter detail the UI can prompt on.
 *
 * A count alone says something is stuck but not whether it is one operation
 * from this morning or forty from last month — which is the difference
 * between offering "retry" and telling the user to get help.
 */
export interface DeadLetterState {
  count: number;
  byType: Record<string, number>;
  oldestFailedAt: string | null;
}

const EMPTY_DEAD_LETTER: DeadLetterState = {
  count: 0,
  byType: {},
  oldestFailedAt: null,
};

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
 * @param options        Optional dead-letter detail provider and retry action,
 *                       so the UI can prompt for action on stuck operations.
 */
export function useOfflineSync(
  syncCallback?: () => Promise<void>,
  getStatus?: () => Promise<OfflineSyncStatusSnapshot>,
  options: {
    getDeadLetterSummary?: () => Promise<DeadLetterState>;
    retryDeadLetter?: () => Promise<number>;
  } = {},
) {
  const { getDeadLetterSummary, retryDeadLetter } = options;
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [conflictState, setConflictState] = useState<ConflictState>({
    pending: 0,
    conflicted: 0,
    resolved: 0,
  });
  const [deadLetterCount, setDeadLetterCount] = useState<number>(0);
  const [deadLetter, setDeadLetter] = useState<DeadLetterState>(EMPTY_DEAD_LETTER);
  const [isRetryingDeadLetter, setIsRetryingDeadLetter] = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // Initial offline check
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
  }, []);

  /** Refreshes the dead-letter detail, when a provider was supplied. */
  const refreshDeadLetter = useCallback(async () => {
    if (!getDeadLetterSummary) return;
    try {
      const summary = await getDeadLetterSummary();
      setDeadLetter(summary);
      setDeadLetterCount(summary.count);
    } catch (error) {
      logger.error('Failed to refresh dead-letter queue', { error });
    }
  }, [getDeadLetterSummary]);

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
      setDeadLetter((current) =>
        current.count === status.deadLetter ? current : { ...current, count: status.deadLetter },
      );
    } catch (error) {
      logger.error('Failed to refresh offline sync status', { error });
    }
  }, [getStatus]);

  // Dead-lettered operations are invisible until something reads them, and a
  // user arriving with a stuck queue has not triggered a sync yet — so read
  // once on mount rather than waiting for the next drain.
  useEffect(() => {
    void refreshStatus();
    void refreshDeadLetter();
  }, [refreshStatus, refreshDeadLetter]);

  /** Re-enqueues every dead-lettered operation and syncs. */
  const retryDeadLetterOperations = useCallback(async (): Promise<number> => {
    if (!retryDeadLetter) return 0;

    setIsRetryingDeadLetter(true);
    try {
      const requeued = await retryDeadLetter();
      await refreshDeadLetter();
      return requeued;
    } catch (error) {
      logger.error('Failed to retry dead-lettered operations', { error });
      return 0;
    } finally {
      setIsRetryingDeadLetter(false);
    }
  }, [retryDeadLetter, refreshDeadLetter]);

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
      await refreshDeadLetter();
    } catch (error) {
      logger.error('Offline synchronization failed', { error });
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, syncCallback, refreshStatus, refreshDeadLetter]);

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
    /** Full dead-letter detail: count, breakdown by type, oldest failure. */
    deadLetter,
    /** True when operations are stuck and the UI should prompt for action. */
    hasDeadLetter: deadLetterCount > 0,
    refreshDeadLetter,
    retryDeadLetterOperations,
    isRetryingDeadLetter,
    conflicts,
  };
}
