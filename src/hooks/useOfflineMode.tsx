'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  OfflineStorage,
  OfflineSyncService,
  OfflineCourseRecord,
  OfflineProgressRecord,
  SyncResult,
  SyncConflict
} from '../services/offlineSync';

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

export const useOfflineMode = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  const storageRef = useRef<OfflineStorage | null>(null);
  const syncRef = useRef<OfflineSyncService | null>(null);

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

  const downloadCourse = useCallback(async (course: DownloadCourseInput, options: DownloadOptions = {}) => {
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
          downloadedAt: new Date().toISOString()
        };

        await storageRef.current.saveAsset(assetRecord);
        downloadedAssets.push({
          id: assetRecord.id,
          url: assetRecord.url,
          mimeType: assetRecord.mimeType,
          sizeBytes: assetRecord.sizeBytes
        });

        completed += 1;
        const progress = Math.round((completed / assets.length) * 100);
        options.onProgress?.(progress);
      }
    } else {
      options.onProgress?.(100);
    }

    const sizeBytes = downloadedAssets.reduce((acc, asset) => acc + asset.sizeBytes, 0) || estimateCourseSize(course);

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
      sizeBytes
    };

    await storageRef.current.saveCourse(record);
    return record;
  }, []);

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

  const saveProgress = useCallback(async (
    courseId: string,
    moduleId: string,
    progress: number,
    completed = false
  ): Promise<OfflineProgressRecord> => {
    if (!storageRef.current || !syncRef.current) {
      throw new Error('Offline mode not initialized');
    }

    const record: OfflineProgressRecord = {
      courseId,
      moduleId,
      progress,
      completed,
      updatedAt: new Date().toISOString(),
      synced: false
    };

    await storageRef.current.saveProgress(record);
    await syncRef.current.enqueue('course_progress', record);
    return record;
  }, []);

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
    return await syncRef.current.syncData({ resolveConflicts: 'auto' });
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

  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    if (!syncRef.current) return;
    await syncRef.current.resolveConflict(conflictId, resolution);
  }, []);

  const resolveAllConflicts = useCallback(async (resolution: 'local' | 'remote' | 'merge' = 'local') => {
    if (!syncRef.current) return;
    const conflicts = await syncRef.current.getPendingConflicts();
    await Promise.all(conflicts.map(conflict => syncRef.current?.resolveConflict(conflict.id, resolution)));
  }, []);

  const getCachedAssetUrl = useCallback(async (url: string): Promise<string | null> => {
    if (!storageRef.current) return null;
    const asset = await storageRef.current.getAssetByUrl(url);
    if (!asset) return null;
    return URL.createObjectURL(asset.data);
  }, []);

  return useMemo(() => ({
    isInitialized,
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
    getStorageInfo,
    getPendingSyncCount,
    getPendingConflicts,
    resolveConflict,
    resolveAllConflicts,
    getCachedAssetUrl
  }), [
    isInitialized,
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
    getStorageInfo,
    getPendingSyncCount,
    getPendingConflicts,
    resolveConflict,
    resolveAllConflicts,
    getCachedAssetUrl
  ]);
};
