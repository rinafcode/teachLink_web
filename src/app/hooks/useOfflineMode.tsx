'use client';

import { useCallback, useEffect, useState } from 'react';
import { openDB, IDBPDatabase } from 'idb';

// Database schema
interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  modules: ModuleData[];
  downloadedAt: Date;
  size: number;
}

interface ModuleData {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'document';
  content: any;
  duration?: number;
}

interface ProgressData {
  courseId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
  lastAccessed: Date;
  offlineTimestamp: Date;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  type: 'progress' | 'quiz_result' | 'bookmark' | 'note';
  data: any;
  timestamp: Date;
  retryCount: number;
}

class OfflineDatabase {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'teachlink-offline';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade: (db) => {
        // Courses store
        if (!db.objectStoreNames.contains('courses')) {
          const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
          courseStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: ['courseId', 'moduleId'] });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cache store for static assets
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'url' });
        }
      },
    });
  }

  async saveCourse(course: CourseData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('courses', course);
  }

  async getCourse(courseId: string): Promise<CourseData | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('courses', courseId);
  }

  async getAllCourses(): Promise<CourseData[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('courses');
  }

  async deleteCourse(courseId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('courses', courseId);
  }

  async saveProgress(progress: ProgressData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('progress', progress);
  }

  async getProgress(courseId: string, moduleId: string): Promise<ProgressData | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('progress', [courseId, moduleId]);
  }

  async getCourseProgress(courseId: string): Promise<ProgressData[]> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const index = store.index('courseId');
    return await index.getAll(courseId);
  }

  async getUnsyncedProgress(): Promise<ProgressData[]> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const index = store.index('synced');
    return await index.getAll(false);
  }

  async markProgressSynced(courseId: string, moduleId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const progress = await this.getProgress(courseId, moduleId);
    if (progress) {
      progress.synced = true;
      await this.saveProgress(progress);
    }
  }

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('syncQueue', item);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('syncQueue');
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('syncQueue', id);
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').clear();
  }

  async cacheAsset(url: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('cache', { url, data, timestamp: new Date() });
  }

  async getCachedAsset(url: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    const cached = await this.db.get('cache', url);
    return cached?.data;
  }

  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Estimate storage usage
    const courses = await this.getAllCourses();
    const progress = await this.db.getAll('progress');
    const syncQueue = await this.getSyncQueue();
    
    const used = courses.reduce((acc, course) => acc + (course.size || 0), 0) +
                 progress.length * 1024 + // Estimate 1KB per progress record
                 syncQueue.length * 512;  // Estimate 512B per sync item
    
    // Get quota info if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      return { used, total, percentage };
    }
    
    return { used, total: 0, percentage: 0 };
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('courses');
    await this.db.clear('progress');
    await this.db.clear('syncQueue');
    await this.db.clear('cache');
  }
}

export const useOfflineMode = () => {
  const [db, setDb] = useState<OfflineDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeOfflineMode = useCallback(async () => {
    try {
      const database = new OfflineDatabase();
      await database.init();
      setDb(database);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize offline mode:', error);
      throw error;
    }
  }, []);

  const cleanupOfflineMode = useCallback(async () => {
    if (db) {
      await db.clearAll();
      setDb(null);
      setIsInitialized(false);
    }
  }, [db]);

  const downloadCourse = useCallback(async (courseId: string, courseData: any): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    try {
      // Simulate downloading course content
      const course: CourseData = {
        id: courseId,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        duration: courseData.duration || 0,
        modules: courseData.modules || [],
        downloadedAt: new Date(),
        size: courseData.size || 0
      };

      await db.saveCourse(course);
    } catch (error) {
      console.error('Failed to download course:', error);
      throw error;
    }
  }, [db]);

  const getCourses = useCallback(async (): Promise<CourseData[]> => {
    if (!db) return [];
    return await db.getAllCourses();
  }, [db]);

  const checkCourseAvailability = useCallback(async (courseId: string): Promise<boolean> => {
    if (!db) return false;
    const course = await db.getCourse(courseId);
    return !!course;
  }, [db]);

  const saveProgress = useCallback(async (
    courseId: string,
    moduleId: string,
    progress: number,
    completed: boolean = false
  ): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    const progressData: ProgressData = {
      courseId,
      moduleId,
      progress,
      completed,
      lastAccessed: new Date(),
      offlineTimestamp: new Date(),
      synced: false
    };

    await db.saveProgress(progressData);
  }, [db]);

  const getProgress = useCallback(async (courseId: string, moduleId: string): Promise<ProgressData | undefined> => {
    if (!db) return undefined;
    return await db.getProgress(courseId, moduleId);
  }, [db]);

  const getCourseProgress = useCallback(async (courseId: string): Promise<ProgressData[]> => {
    if (!db) return [];
    return await db.getCourseProgress(courseId);
  }, [db]);

  const syncData = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    try {
      // Get unsynced progress
      const unsyncedProgress = await db.getUnsyncedProgress();
      
      // Get sync queue
      const syncQueue = await db.getSyncQueue();

      // Simulate API calls to sync data
      for (const progress of unsyncedProgress) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.markProgressSynced(progress.courseId, progress.moduleId);
      }

      // Process sync queue
      for (const item of syncQueue) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  }, [db]);

  const clearData = useCallback(async (): Promise<void> => {
    if (!db) return;
    await db.clearAll();
  }, [db]);

  const getStorageInfo = useCallback(async () => {
    if (!db) return { used: 0, total: 0, percentage: 0 };
    return await db.getStorageUsage();
  }, [db]);

  const addToSyncQueue = useCallback(async (type: string, data: any): Promise<void> => {
    if (!db) throw new Error('Database not initialized');

    const syncItem: SyncQueueItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type: type as any,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    await db.addToSyncQueue(syncItem);
  }, [db]);

  const cacheAsset = useCallback(async (url: string, data: any): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    await db.cacheAsset(url, data);
  }, [db]);

  const getCachedAsset = useCallback(async (url: string): Promise<any> => {
    if (!db) return null;
    return await db.getCachedAsset(url);
  }, [db]);

  return {
    isInitialized,
    initializeOfflineMode,
    cleanupOfflineMode,
    downloadCourse,
    getCourses,
    checkCourseAvailability,
    saveProgress,
    getProgress,
    getCourseProgress,
    syncData,
    clearData,
    getStorageInfo,
    addToSyncQueue,
    cacheAsset,
    getCachedAsset
  };
};
