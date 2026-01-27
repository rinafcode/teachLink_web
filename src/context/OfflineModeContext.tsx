'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { OfflineCourseRecord, OfflineProgressRecord, SyncConflict, SyncResult } from '../services/offlineSync';

interface OfflineModeContextType {
  isOnline: boolean;
  isOfflineModeEnabled: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  pendingSyncCount: number;
  pendingConflicts: SyncConflict[];
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
  downloadCourse: (course: Parameters<ReturnType<typeof useOfflineMode>['downloadCourse']>[0], options?: Parameters<ReturnType<typeof useOfflineMode>['downloadCourse']>[1]) => Promise<OfflineCourseRecord>;
  removeCourse: (courseId: string) => Promise<void>;
  getOfflineCourses: () => Promise<OfflineCourseRecord[]>;
  isCourseAvailableOffline: (courseId: string) => Promise<boolean>;
  saveProgress: (courseId: string, moduleId: string, progress: number, completed?: boolean) => Promise<OfflineProgressRecord>;
  syncOfflineData: () => Promise<SyncResult>;
  clearOfflineData: () => Promise<void>;
  refreshStorageUsage: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  resolveAllConflicts: (resolution?: 'local' | 'remote' | 'merge') => Promise<void>;
  getCachedAssetUrl: (url: string) => Promise<string | null>;
}

const OfflineModeContext = createContext<OfflineModeContextType | undefined>(undefined);

interface OfflineModeProviderProps {
  children: React.ReactNode;
}

export const OfflineModeProvider: React.FC<OfflineModeProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [pendingConflicts, setPendingConflicts] = useState<SyncConflict[]>([]);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 });

  const {
    isInitialized,
    initializeOfflineMode,
    cleanupOfflineMode,
    downloadCourse,
    removeCourse,
    getOfflineCourses,
    isCourseAvailableOffline,
    saveProgress,
    syncData,
    getStorageInfo,
    getPendingSyncCount,
    getPendingConflicts,
    resolveAllConflicts,
    getCachedAssetUrl
  } = useOfflineMode();

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStorageUsage = useCallback(async () => {
    if (!isOfflineModeEnabled) return;
    const usage = await getStorageInfo();
    setStorageUsage(usage);
  }, [getStorageInfo, isOfflineModeEnabled]);

  const refreshSyncStatus = useCallback(async () => {
    if (!isOfflineModeEnabled) return;
    const [count, conflicts] = await Promise.all([
      getPendingSyncCount(),
      getPendingConflicts()
    ]);

    setPendingSyncCount(count);
    setPendingConflicts(conflicts);
  }, [getPendingSyncCount, getPendingConflicts, isOfflineModeEnabled]);

  useEffect(() => {
    if (!isOfflineModeEnabled) return;

    refreshStorageUsage();
    refreshSyncStatus();

    const interval = setInterval(() => {
      refreshStorageUsage();
      refreshSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOfflineModeEnabled, refreshStorageUsage, refreshSyncStatus]);

  useEffect(() => {
    if (isOnline && isOfflineModeEnabled && pendingSyncCount > 0) {
      syncOfflineData();
    }
  }, [isOnline, isOfflineModeEnabled, pendingSyncCount]);

  const enableOfflineMode = useCallback(async () => {
    try {
      await initializeOfflineMode();
      setIsOfflineModeEnabled(true);
      setSyncStatus('synced');
      setLastSyncTime(new Date().toISOString());
      await refreshStorageUsage();
      await refreshSyncStatus();
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
      setSyncStatus('error');
    }
  }, [initializeOfflineMode, refreshStorageUsage, refreshSyncStatus]);

  const disableOfflineMode = useCallback(async () => {
    try {
      await cleanupOfflineMode();
      setIsOfflineModeEnabled(false);
      setSyncStatus('idle');
      setLastSyncTime(null);
      setPendingSyncCount(0);
      setPendingConflicts([]);
      setStorageUsage({ used: 0, total: 0, percentage: 0 });
    } catch (error) {
      console.error('Failed to disable offline mode:', error);
    }
  }, [cleanupOfflineMode]);

  const syncOfflineData = useCallback(async () => {
    if (!isOnline || !isInitialized) {
      setSyncStatus('error');
      return { success: false, syncedItems: 0, conflicts: [], errors: ['Offline'], lastSyncTime: new Date().toISOString() } as SyncResult;
    }

    try {
      setSyncStatus('syncing');
      const result = await syncData();
      setSyncStatus(result.success ? 'synced' : 'error');
      setLastSyncTime(result.lastSyncTime);
      await refreshSyncStatus();
      return result;
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      setSyncStatus('error');
      return { success: false, syncedItems: 0, conflicts: [], errors: [String(error)], lastSyncTime: new Date().toISOString() } as SyncResult;
    }
  }, [isOnline, isInitialized, syncData, refreshSyncStatus]);

  const clearOfflineData = useCallback(async () => {
    try {
      await cleanupOfflineMode();
      await initializeOfflineMode();
      setPendingSyncCount(0);
      setPendingConflicts([]);
      setStorageUsage({ used: 0, total: 0, percentage: 0 });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [cleanupOfflineMode, initializeOfflineMode]);

  const value = useMemo(() => ({
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    pendingConflicts,
    storageUsage,
    enableOfflineMode,
    disableOfflineMode,
    downloadCourse,
    removeCourse,
    getOfflineCourses,
    isCourseAvailableOffline,
    saveProgress,
    syncOfflineData,
    clearOfflineData,
    refreshStorageUsage,
    refreshSyncStatus,
    resolveAllConflicts,
    getCachedAssetUrl
  }), [
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    pendingConflicts,
    storageUsage,
    enableOfflineMode,
    disableOfflineMode,
    downloadCourse,
    removeCourse,
    getOfflineCourses,
    isCourseAvailableOffline,
    saveProgress,
    syncOfflineData,
    clearOfflineData,
    refreshStorageUsage,
    refreshSyncStatus,
    resolveAllConflicts,
    getCachedAssetUrl
  ]);

  return (
    <OfflineModeContext.Provider value={value}>
      {children}
    </OfflineModeContext.Provider>
  );
};

export const useOfflineModeContext = () => {
  const context = useContext(OfflineModeContext);
  if (!context) {
    throw new Error('useOfflineModeContext must be used within an OfflineModeProvider');
  }
  return context;
};
