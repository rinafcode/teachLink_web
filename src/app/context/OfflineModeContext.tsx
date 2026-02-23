'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useOfflineMode } from '../hooks/useOfflineMode';

interface OfflineModeContextType {
  isOnline: boolean;
  isOfflineModeEnabled: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: Date | null;
  pendingSyncCount: number;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getOfflineCourses: () => Promise<unknown[]>;
  isCourseAvailableOffline: (courseId: string) => Promise<boolean>;
}

const OfflineModeContext = createContext<OfflineModeContextType | undefined>(undefined);

interface OfflineModeProviderProps {
  children: ReactNode;
}

export const OfflineModeProvider: React.FC<OfflineModeProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  const {
    initializeOfflineMode,
    cleanupOfflineMode,
    syncData,
    clearData,
    getCourses,
    checkCourseAvailability,
    getStorageInfo
  } = useOfflineMode();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && isOfflineModeEnabled && pendingSyncCount > 0) {
      syncOfflineData();
    }
  }, [isOnline, isOfflineModeEnabled, pendingSyncCount]);

  // Update storage usage periodically
  useEffect(() => {
    const updateStorageUsage = async () => {
      if (isOfflineModeEnabled) {
        const storageInfo = await getStorageInfo();
        setStorageUsage(storageInfo);
      }
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isOfflineModeEnabled, getStorageInfo]);

  const enableOfflineMode = useCallback(async () => {
    try {
      await initializeOfflineMode();
      setIsOfflineModeEnabled(true);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
      setSyncStatus('error');
    }
  }, [initializeOfflineMode]);

  const disableOfflineMode = useCallback(async () => {
    try {
      await cleanupOfflineMode();
      setIsOfflineModeEnabled(false);
      setSyncStatus('idle');
      setLastSyncTime(null);
      setPendingSyncCount(0);
    } catch (error) {
      console.error('Failed to disable offline mode:', error);
    }
  }, [cleanupOfflineMode]);

  const syncOfflineData = useCallback(async () => {
    if (!isOnline) {
      setSyncStatus('error');
      return;
    }

    try {
      setSyncStatus('syncing');
      await syncData();
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      setPendingSyncCount(0);
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      setSyncStatus('error');
    }
  }, [isOnline, syncData]);

  const clearOfflineData = useCallback(async () => {
    try {
      await clearData();
      setPendingSyncCount(0);
      setStorageUsage({ used: 0, total: 0, percentage: 0 });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [clearData]);

  const getOfflineCourses = useCallback(async () => {
    if (!isOfflineModeEnabled) return [];
    return await getCourses();
  }, [isOfflineModeEnabled, getCourses]);

  const isCourseAvailableOffline = useCallback(async (courseId: string) => {
    if (!isOfflineModeEnabled) return false;
    return await checkCourseAvailability(courseId);
  }, [isOfflineModeEnabled, checkCourseAvailability]);

  const value: OfflineModeContextType = {
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    storageUsage,
    enableOfflineMode,
    disableOfflineMode,
    syncOfflineData,
    clearOfflineData,
    getOfflineCourses,
    isCourseAvailableOffline
  };

  return (
    <OfflineModeContext.Provider value={value}>
      {children}
    </OfflineModeContext.Provider>
  );
};

export const useOfflineModeContext = () => {
  const context = useContext(OfflineModeContext);
  if (context === undefined) {
    throw new Error('useOfflineModeContext must be used within an OfflineModeProvider');
  }
  return context;
};
