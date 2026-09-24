'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CONNECTIVITY_DEBOUNCE_MS,
  createConnectivityDebouncer,
  type ConnectivityDebouncer,
} from '../utils/pwaUtils';
import {
  OfflineStorage,
  OfflineSyncService,
  OfflineCourseRecord,
  OfflineProgressRecord,
  SyncResult,
  SyncConflict,
  SyncStatus,
} from '../services/offlineSync';
import { incrementVersionVector } from '../lib/conflict/resolver';
import { syncEngine } from '../store/synchronizationEngine';

export interface DownloadCourseInput {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  modules: Array<{
    id: string;
    title: string;
    type: 'video' | 'quiz' | 'document' | 'live' | 'assignment';
    content?: any;
    durationSeconds?: number;
    assetUrls?: string[];
  }>;
  assets?: Array<{ url: string; mimeType?: string }>;
  sizeBytes?: number;
}

export interface DownloadOptions {
  onProgress?: (percentage: number) => void;
}

const estimateCourseSize = (course: DownloadCourseInput) => {
  const moduleEstimate = course.modules.length * 150 * 1024; // 150KB per module metadata
  const assetEstimate = (course.assets?.length || 0) * 1024 * 1024; // 1MB per asset if unknown
  return (course.sizeBytes || 0) + moduleEstimate + assetEstimate;
};

export interface OfflineModeOptions {
  /** Settle time for connectivity changes. Defaults to CONNECTIVITY_DEBOUNCE_MS. */
  connectivityDebounceMs?: number;
}

export const useOfflineMode = (options: OfflineModeOptions = {}) => {
  const { connectivityDebounceMs = CONNECTIVITY_DEBOUNCE_MS } = options;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  const storageRef = useRef<OfflineStorage | null>(null);
  const syncRef = useRef<OfflineSyncService | null>(null);
  const debouncerRef = useRef<ConnectivityDebouncer | null>(null);

  const initializeOfflineMode = useCallback(async () => {
    if (storageRef.current && syncRef.current) {
      setIsInitialized(true);
      return;
    }

    const storage = new OfflineStorage();
    await storage.init();

    storageRef.current = storage;
    syncRef.current = new OfflineSyncService(storage);
    setIsInitialized(true);
  }, []);

  const cleanupOfflineMode = useCallback(async () => {
    if (!storageRef.current) return;
    await storageRef.current.clearAll();
    storageRef.current = null;
    syncRef.current = null;
    setIsInitialized(false);
  }, []);

  const downloadCourse = useCallback(
    async (course: DownloadCourseInput, options: DownloadOptions = {}) => {
      if (!storageRef.current) throw new Error('Offline mode not initialized');

      const assets = course.assets ?? [];
      const downloadedAssets: OfflineCourseRecord['assets'] = [];

      if (assets.length > 0) {
        let completed = 0;
        for (const asset of assets) {
          const response = await fetch(asset.url);
          const blob = await response.blob();
          const mimeType = asset.mimeType || blob.type || 'application/octet-stream';
          const assetRecord = {
            id: `${course.id}-${completed}-${Math.random().toString(36).slice(2)}`,
            courseId: course.id,
            url: asset.url,
            mimeType,
            sizeBytes: blob.size,
            data: blob,
            downloadedAt: new Date().toISOString(),
          };

          await storageRef.current.saveAsset(assetRecord);
          downloadedAssets.push({
            id: assetRecord.id,
            url: assetRecord.url,
            mimeType: assetRecord.mimeType,
            sizeBytes: assetRecord.sizeBytes,
          });

          completed += 1;
          const progress = Math.round((completed / assets.length) * 100);
          options.onProgress?.(progress);
        }
      } else {
        options.onProgress?.(100);
      }

      const sizeBytes =
        downloadedAssets.reduce((acc, asset) => acc + asset.sizeBytes, 0) ||
        estimateCourseSize(course);

      const record: OfflineCourseRecord = {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        durationSeconds: course.durationSeconds,
        modules: course.modules,
        assets: downloadedAssets,
        downloadedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        sizeBytes,
      };

      await storageRef.current.saveCourse(record);
      return record;
    },
    [],
  );

  const removeCourse = useCallback(async (courseId: string) => {
    if (!storageRef.current) return;
    await storageRef.current.deleteCourse(courseId);
  }, []);

  const getOfflineCourses = useCallback(async () => {
    if (!storageRef.current) return [] as OfflineCourseRecord[];
    return await storageRef.current.getCourses();
  }, []);

  const isCourseAvailableOffline = useCallback(async (courseId: string) => {
    if (!storageRef.current) return false;
    const course = await storageRef.current.getCourse(courseId);
    return Boolean(course);
  }, []);

  const saveProgress = useCallback(
    async (
      courseId: string,
      moduleId: string,
      progress: number,
      completed = false,
    ): Promise<OfflineProgressRecord> => {
      if (!storageRef.current || !syncRef.current) {
        throw new Error('Offline mode not initialized');
      }

      const existing = await storageRef.current.getProgress(courseId, moduleId);
      const replicaId = await storageRef.current.getReplicaId();
      const version = (existing?.version ?? 0) + 1;
      const logicalClock = (existing?.logicalClock ?? 0) + 1;
      // Deterministic per-record versioning: base the new vector on the last
      // known state so merges are stable regardless of device clock drift.
      const versionVector = incrementVersionVector(existing?.versionVector ?? {}, replicaId);
      const record: OfflineProgressRecord = {
        courseId,
        moduleId,
        progress,
        completed,
        updatedAt: new Date().toISOString(),
        synced: false,
        version,
        logicalClock,
        updatedBy: replicaId,
        versionVector,
      };

      await storageRef.current.saveProgress(record);
      await syncRef.current.enqueue('course_progress', record);
      return record;
    },
    [],
  );

  const getProgress = useCallback(async (courseId: string, moduleId: string) => {
    if (!storageRef.current) return undefined;
    return await storageRef.current.getProgress(courseId, moduleId);
  }, []);

  const getCourseProgress = useCallback(async (courseId: string) => {
    if (!storageRef.current) return [] as OfflineProgressRecord[];
    return await storageRef.current.getCourseProgress(courseId);
  }, []);

  const syncData = useCallback(async (): Promise<SyncResult> => {
    if (!syncRef.current) throw new Error('Offline mode not initialized');
    const result = await syncRef.current.syncData({ resolveConflicts: 'auto' });

    // Reconcile the persisted store after each drain so other tabs and a
    // restarted app observe the same sync state.
    try {
      const status = await syncRef.current.getSyncStatus();
      await syncEngine.recordDrainResult(
        {
          success: result.success,
          syncedItems: result.syncedItems,
          conflicts: result.conflicts.length,
          lastSyncTime: result.lastSyncTime,
        },
        status.pending,
      );
    } catch (error) {
      // Store reconciliation is best-effort; the drain itself already succeeded.
      console.warn('Failed to reconcile sync state', error);
    }

    return result;
  }, []);

  const getSyncStatus = useCallback(async (): Promise<SyncStatus> => {
    if (!syncRef.current) {
      return {
        isSyncing: false,
        pending: 0,
        conflicted: 0,
        resolved: 0,
        deadLetter: 0,
        lastSyncTime: null,
      };
    }
    return await syncRef.current.getSyncStatus();
  }, []);

  const getDeadLetterCount = useCallback(async (): Promise<number> => {
    if (!syncRef.current) return 0;
    return await syncRef.current.getDeadLetterCount();
  }, []);

  const retryDeadLetter = useCallback(async (id: string): Promise<boolean> => {
    if (!syncRef.current) return false;
    return await syncRef.current.retryDeadLetter(id);
  }, []);

  const getStorageInfo = useCallback(async () => {
    if (!storageRef.current) return { used: 0, total: 0, percentage: 0 };
    return await storageRef.current.getStorageUsage();
  }, []);

  const getPendingSyncCount = useCallback(async () => {
    if (!syncRef.current) return 0;
    return await syncRef.current.getQueueLength();
  }, []);

  const getPendingConflicts = useCallback(async (): Promise<SyncConflict[]> => {
    if (!syncRef.current) return [];
    return await syncRef.current.getPendingConflicts();
  }, []);

  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
      if (!syncRef.current) return;
      await syncRef.current.resolveConflict(conflictId, resolution);
    },
    [],
  );

  const resolveAllConflicts = useCallback(
    async (resolution: 'local' | 'remote' | 'merge' = 'local') => {
      if (!syncRef.current) return;
      const conflicts = await syncRef.current.getPendingConflicts();
      await Promise.all(
        conflicts.map((conflict) => syncRef.current?.resolveConflict(conflict.id, resolution)),
      );
    },
    [],
  );

  const getCachedAssetUrl = useCallback(async (url: string): Promise<string | null> => {
    if (!storageRef.current) return null;
    const asset = await storageRef.current.getAssetByUrl(url);
    if (!asset) return null;
    return URL.createObjectURL(asset.data);
  }, []);

  // Held in a ref so the listeners below are attached once, rather than being
  // torn down and re-subscribed every time syncData's identity changes.
  const syncDataRef = useRef(syncData);
  syncDataRef.current = syncData;

  /**
   * Reacts to connectivity only once it has held for the debounce window.
   *
   * A flapping connection fires `online`/`offline` several times a second, and
   * each `online` used to start a sync that the next `offline` interrupted —
   * so the queue never drained and every partial attempt burned a retry.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const debouncer = createConnectivityDebouncer(
      navigator.onLine,
      (online) => {
        setIsOnline(online);
        if (online) void syncDataRef.current().catch(() => undefined);
      },
      { debounceMs: connectivityDebounceMs },
    );

    debouncerRef.current = debouncer;

    const handleOnline = () => debouncer.push(true);
    const handleOffline = () => debouncer.push(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // A pending timer firing after unmount would sync against a torn-down
      // service.
      debouncer.cancel();
      debouncerRef.current = null;
    };
  }, [connectivityDebounceMs]);

  /** Applies the pending connectivity state immediately, skipping the wait. */
  const flushConnectivity = useCallback(() => {
    debouncerRef.current?.flush();
  }, []);

  return useMemo(
    () => ({
      isInitialized,
      isOnline,
      flushConnectivity,
      initializeOfflineMode,
      cleanupOfflineMode,
      downloadCourse,
      removeCourse,
      getOfflineCourses,
      isCourseAvailableOffline,
      saveProgress,
      getProgress,
      getCourseProgress,
      syncData,
      getSyncStatus,
      getDeadLetterCount,
      retryDeadLetter,
      getStorageInfo,
      getPendingSyncCount,
      getPendingConflicts,
      resolveConflict,
      resolveAllConflicts,
      getCachedAssetUrl,
    }),
    [
      isInitialized,
      isOnline,
      flushConnectivity,
      initializeOfflineMode,
      cleanupOfflineMode,
      downloadCourse,
      removeCourse,
      getOfflineCourses,
      isCourseAvailableOffline,
      saveProgress,
      getProgress,
      getCourseProgress,
      syncData,
      getSyncStatus,
      getDeadLetterCount,
      retryDeadLetter,
      getStorageInfo,
      getPendingSyncCount,
      getPendingConflicts,
      resolveConflict,
      resolveAllConflicts,
      getCachedAssetUrl,
    ],
  );
};
