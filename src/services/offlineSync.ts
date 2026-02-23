/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { openDB, IDBPDatabase } from 'idb';

export type SyncItemType = 'course_progress';

export interface OfflineAssetRecord {
  id: string;
  courseId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  data: Blob;
  downloadedAt: string;
}

export interface OfflineCourseRecord {
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
  assets: Array<{
    id: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  downloadedAt: string;
  lastAccessedAt?: string;
  sizeBytes: number;
}

export interface OfflineProgressRecord {
  courseId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
  updatedAt: string;
  synced: boolean;
  syncedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  entityKey: string;
  data: any;
  timestamp: string;
  version: number;
}

export interface SyncConflict {
  id: string;
  type: SyncItemType;
  entityKey: string;
  localItem: SyncQueueItem;
  remoteItem: SyncQueueItem;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflicts: SyncConflict[];
  errors: string[];
  lastSyncTime: string;
}

export interface SyncOptions {
  forceSync?: boolean;
  resolveConflicts?: 'auto' | 'manual' | 'local' | 'remote' | 'merge';
  retryAttempts?: number;
}

export const OFFLINE_DB_NAME = 'teachlink-offline';
export const OFFLINE_DB_VERSION = 2;

const ensureBrowser = () => {
  if (typeof window === 'undefined') {
    throw new Error('Offline storage is only available in the browser');
  }
};

const createEntityKey = (_type: SyncItemType, data: any) => {
  return `${data.courseId}:${data.moduleId}`;
};

export class OfflineStorage {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    ensureBrowser();
    this.db = await openDB(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
      upgrade: (db) => {
        if (!db.objectStoreNames.contains('courses')) {
          const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
          courseStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('courseId', 'courseId', { unique: false });
          assetStore.createIndex('url', 'url', { unique: false });
        }

        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: ['courseId', 'moduleId'] });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
          progressStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('entityKey', 'entityKey', { unique: false });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
          conflictStore.createIndex('entityKey', 'entityKey', { unique: false });
        }
      }
    });
  }

  getDb(): IDBPDatabase {
    if (!this.db) {
      throw new Error('Offline database not initialized');
    }
    return this.db;
  }

  async saveCourse(course: OfflineCourseRecord): Promise<void> {
    const db = this.getDb();
    await db.put('courses', course);
  }

  async getCourse(courseId: string): Promise<OfflineCourseRecord | undefined> {
    const db = this.getDb();
    return await db.get('courses', courseId);
  }

  async getCourses(): Promise<OfflineCourseRecord[]> {
    const db = this.getDb();
    return await db.getAll('courses');
  }

  async deleteCourse(courseId: string): Promise<void> {
    const db = this.getDb();
    const tx = db.transaction(['courses', 'assets', 'progress'], 'readwrite');
    await tx.objectStore('courses').delete(courseId);

    const assetIndex = tx.objectStore('assets').index('courseId');
    const assets = await assetIndex.getAll(courseId);
    for (const asset of assets) {
      await tx.objectStore('assets').delete(asset.id);
    }

    const progressIndex = tx.objectStore('progress').index('courseId');
    const progressItems = await progressIndex.getAll(courseId);
    for (const progress of progressItems) {
      await tx.objectStore('progress').delete([progress.courseId, progress.moduleId]);
    }

    await tx.done;
  }

  async saveAsset(asset: OfflineAssetRecord): Promise<void> {
    const db = this.getDb();
    await db.put('assets', asset);
  }

  async getAssetsForCourse(courseId: string): Promise<OfflineAssetRecord[]> {
    const db = this.getDb();
    const index = db.transaction('assets').objectStore('assets').index('courseId');
    return await index.getAll(courseId);
  }

  async getAssetByUrl(url: string): Promise<OfflineAssetRecord | undefined> {
    const db = this.getDb();
    const index = db.transaction('assets').objectStore('assets').index('url');
    const results = await index.getAll(url);
    return results[0];
  }

  async saveProgress(progress: OfflineProgressRecord): Promise<void> {
    const db = this.getDb();
    await db.put('progress', progress);
  }

  async getProgress(courseId: string, moduleId: string): Promise<OfflineProgressRecord | undefined> {
    const db = this.getDb();
    return await db.get('progress', [courseId, moduleId]);
  }

  async getCourseProgress(courseId: string): Promise<OfflineProgressRecord[]> {
    const db = this.getDb();
    const index = db.transaction('progress').objectStore('progress').index('courseId');
    return await index.getAll(courseId);
  }

  async getUnsyncedProgress(): Promise<OfflineProgressRecord[]> {
    const db = this.getDb();
    const index = db.transaction('progress').objectStore('progress').index('synced');
    const all = await index.getAll();
    return all.filter((p) => !p.synced);
  }

  async markProgressSynced(courseId: string, moduleId: string, syncedAt: string): Promise<void> {
    const existing = await this.getProgress(courseId, moduleId);
    if (!existing) return;

    const updated = {
      ...existing,
      synced: true,
      syncedAt
    };

    await this.saveProgress(updated);
  }

  async clearAll(): Promise<void> {
    const db = this.getDb();
    await db.clear('courses');
    await db.clear('assets');
    await db.clear('progress');
    await db.clear('syncQueue');
    await db.clear('conflicts');
  }

  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const db = this.getDb();
    const courses = await db.getAll('courses');
    const assets = await db.getAll('assets');
    const progress = await db.getAll('progress');
    const syncQueue = await db.getAll('syncQueue');

    const used =
      courses.reduce((acc, course) => acc + (course.sizeBytes || 0), 0) +
      assets.reduce((acc, asset) => acc + (asset.sizeBytes || 0), 0) +
      progress.length * 1024 +
      syncQueue.length * 512;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      return { used, total, percentage };
    }

    return { used, total: 0, percentage: 0 };
  }
}

export class OfflineSyncService {
  private readonly storage: OfflineStorage;
  private isSyncing = false;

  constructor(storage: OfflineStorage) {
    this.storage = storage;
  }

  private get db(): IDBPDatabase {
    return this.storage.getDb();
  }

  async enqueue(type: SyncItemType, data: any): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      entityKey: createEntityKey(type, data),
      data,
      timestamp: new Date().toISOString(),
      version: 1
    };

    await this.db.put('syncQueue', item);
    return item;
  }

  async getQueue(): Promise<SyncQueueItem[]> {
    return await this.db.getAll('syncQueue');
  }

  async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.db.delete('syncQueue', id);
  }

  async clearQueue(): Promise<void> {
    await this.db.clear('syncQueue');
  }

  private async addConflict(conflict: SyncConflict): Promise<void> {
    await this.db.put('conflicts', conflict);
  }

  async getPendingConflicts(): Promise<SyncConflict[]> {
    const index = this.db.transaction('conflicts').objectStore('conflicts').index('resolved');
    return await index.getAll(IDBKeyRange.only(false));
  }

  async resolveConflict(conflictId: string, resolution: SyncConflict['resolution']): Promise<void> {
    const conflict = await this.db.get('conflicts', conflictId);
    if (!conflict) return;

    const resolvedConflict: SyncConflict = {
      ...conflict,
      resolution,
      resolved: true,
      resolvedAt: new Date().toISOString()
    };

    await this.db.put('conflicts', resolvedConflict);
  }

  async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing && !options.forceSync) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;

    const result: SyncResult = {
      success: false,
      syncedItems: 0,
      conflicts: [],
      errors: [],
      lastSyncTime: new Date().toISOString()
    };

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        result.success = true;
        return result;
      }

      const grouped = queue.reduce<Record<string, SyncQueueItem[]>>((acc, item) => {
        acc[item.type] = acc[item.type] || [];
        acc[item.type].push(item);
        return acc;
      }, {});

      for (const items of Object.values(grouped)) {
        const syncResult = await this.syncProgressItems(items, options);
        result.syncedItems += syncResult.syncedItems;
        result.conflicts.push(...syncResult.conflicts);
        result.errors.push(...syncResult.errors);
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Sync failed: ${String(error)}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncProgressItems(
    items: SyncQueueItem[],
    options: SyncOptions
  ): Promise<{ syncedItems: number; conflicts: SyncConflict[]; errors: string[] }> {
    const groupedByEntity = items.reduce<Record<string, SyncQueueItem[]>>((acc, item) => {
      if (!acc[item.entityKey]) acc[item.entityKey] = [];
      acc[item.entityKey].push(item);
      return acc;
    }, {});

    const conflicts: SyncConflict[] = [];
    const errors: string[] = [];
    let syncedItems = 0;

    for (const [entityKey, entityItems] of Object.entries(groupedByEntity)) {
      const candidate = this.pickBestProgressItem(entityItems);
      if (!candidate) continue;

      const [courseId, moduleId] = entityKey.split(':');
      const existing = await this.storage.getProgress(courseId, moduleId);
      const hasRemoteNewer = existing?.synced && existing.updatedAt > candidate.data.updatedAt;

      if (hasRemoteNewer) {
        const conflict: SyncConflict = {
          id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: candidate.type,
          entityKey,
          localItem: candidate,
          remoteItem: {
            ...candidate,
            data: {
              ...candidate.data,
              progress: existing.progress,
              completed: existing.completed,
              updatedAt: existing.updatedAt
            },
            timestamp: existing.updatedAt,
            version: candidate.version + 1
          },
          resolution: 'manual',
          resolved: false,
          createdAt: new Date().toISOString()
        };

        const resolution = this.resolveConflictStrategy(conflict, options);
        conflict.resolution = resolution;
        conflict.resolved = resolution !== 'manual';
        conflict.resolvedAt = conflict.resolved ? new Date().toISOString() : undefined;

        await this.addConflict(conflict);
        conflicts.push(conflict);

        if (conflict.resolved && resolution !== 'remote') {
          await this.storage.saveProgress({
            courseId,
            moduleId,
            progress: candidate.data.progress,
            completed: candidate.data.completed,
            updatedAt: candidate.data.updatedAt,
            synced: true,
            syncedAt: new Date().toISOString()
          });
        }
      } else {
        await this.storage.saveProgress({
          courseId,
          moduleId,
          progress: candidate.data.progress,
          completed: candidate.data.completed,
          updatedAt: candidate.data.updatedAt,
          synced: true,
          syncedAt: new Date().toISOString()
        });
      }

      for (const item of entityItems) {
        await this.removeFromQueue(item.id);
        syncedItems += 1;
      }
    }

    return { syncedItems, conflicts, errors };
  }

  private pickBestProgressItem(items: SyncQueueItem[]): SyncQueueItem | null {
    if (items.length === 0) return null;

    return items.reduce((best, current) => {
      const bestUpdated = new Date(best.data.updatedAt).getTime();
      const currentUpdated = new Date(current.data.updatedAt).getTime();
      if (currentUpdated > bestUpdated) return current;
      if (currentUpdated === bestUpdated && current.data.progress > best.data.progress) return current;
      if (current.data.completed && !best.data.completed) return current;
      return best;
    });
  }

  private resolveConflictStrategy(conflict: SyncConflict, options: SyncOptions): SyncConflict['resolution'] {
    if (options.resolveConflicts === 'local' || options.resolveConflicts === 'remote' || options.resolveConflicts === 'merge') {
      return options.resolveConflicts;
    }

    if (options.resolveConflicts === 'manual') {
      return 'manual';
    }

    const localUpdated = new Date(conflict.localItem.data.updatedAt).getTime();
    const remoteUpdated = new Date(conflict.remoteItem.data.updatedAt).getTime();

    if (localUpdated === remoteUpdated) {
      return conflict.localItem.data.progress >= conflict.remoteItem.data.progress ? 'local' : 'remote';
    }

    return localUpdated > remoteUpdated ? 'local' : 'remote';
  }


}
