'use client';

import { openDB, IDBPDatabase } from 'idb';

// Types for sync operations
export interface SyncItem {
  id: string;
  type: 'progress' | 'quiz_result' | 'bookmark' | 'note' | 'course_progress';
  data: any;
  timestamp: Date;
  version: number;
  conflictResolution?: 'local' | 'remote' | 'merge';
}

export interface SyncConflict {
  localItem: SyncItem;
  remoteItem: SyncItem;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflicts: SyncConflict[];
  errors: string[];
  lastSyncTime: Date;
}

export interface SyncOptions {
  forceSync?: boolean;
  resolveConflicts?: 'auto' | 'manual' | 'local' | 'remote';
  retryAttempts?: number;
  retryDelay?: number;
}

class OfflineSyncService {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'teachlink-sync';
  private readonly DB_VERSION = 1;
  private isSyncing = false;
  private syncQueue: SyncItem[] = [];

  async init(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade: (db) => {
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync history store
        if (!db.objectStoreNames.contains('syncHistory')) {
          const historyStore = db.createObjectStore('syncHistory', { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Conflict resolution store
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
        }
      },
    });
  }

  async addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'version'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const syncItem: SyncItem = {
      ...item,
      id: `${item.type}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      version: 1
    };

    await this.db.put('syncQueue', syncItem);
    this.syncQueue.push(syncItem);
  }

  async getSyncQueue(): Promise<SyncItem[]> {
    if (!this.db) return [];
    return await this.db.getAll('syncQueue');
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('syncQueue', id);
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) return;
    await this.db.clear('syncQueue');
    this.syncQueue = [];
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
      lastSyncTime: new Date()
    };

    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        result.success = true;
        return result;
      }

      // Group items by type for batch processing
      const groupedItems = this.groupItemsByType(queue);
      
      for (const [type, items] of Object.entries(groupedItems)) {
        try {
          const typeResult = await this.syncItemType(type, items, options);
          result.syncedItems += typeResult.syncedItems;
          result.conflicts.push(...typeResult.conflicts);
        } catch (error) {
          result.errors.push(`Failed to sync ${type}: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
      await this.recordSyncHistory(result);

    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private groupItemsByType(items: SyncItem[]): Record<string, SyncItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    }, {} as Record<string, SyncItem[]>);
  }

  private async syncItemType(
    type: string, 
    items: SyncItem[], 
    options: SyncOptions
  ): Promise<{ syncedItems: number; conflicts: SyncConflict[] }> {
    const result = { syncedItems: 0, conflicts: [] as SyncConflict[] };

    // Simulate API calls for different item types
    for (const item of items) {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Simulate potential conflicts
        const hasConflict = Math.random() < 0.1; // 10% chance of conflict
        if (hasConflict) {
          const conflict = await this.handleConflict(item, options);
          result.conflicts.push(conflict);
        } else {
          // Simulate successful sync
          await this.simulateApiCall(type, item);
          await this.removeFromSyncQueue(item.id);
          result.syncedItems++;
        }
      } catch (error) {
        // Handle retry logic
        if (item.version < (options.retryAttempts || 3)) {
          item.version++;
          await this.updateSyncItem(item);
        } else {
          throw error;
        }
      }
    }

    return result;
  }

  private async handleConflict(
    item: SyncItem, 
    options: SyncOptions
  ): Promise<SyncConflict> {
    // Simulate getting remote version
    const remoteItem: SyncItem = {
      ...item,
      id: item.id,
      timestamp: new Date(Date.now() - 1000), // Slightly older
      version: item.version + 1
    };

    const conflict: SyncConflict = {
      localItem: item,
      remoteItem,
      resolution: 'manual'
    };

    // Auto-resolve if specified
    if (options.resolveConflicts && options.resolveConflicts !== 'manual') {
      conflict.resolution = options.resolveConflicts as 'local' | 'remote' | 'merge';
      await this.resolveConflict(conflict);
    }

    return conflict;
  }

  private async resolveConflict(conflict: SyncConflict): Promise<void> {
    switch (conflict.resolution) {
      case 'local':
        // Keep local version, update remote
        await this.simulateApiCall(conflict.localItem.type, conflict.localItem);
        break;
      case 'remote':
        // Use remote version, update local
        await this.updateLocalData(conflict.remoteItem);
        break;
      case 'merge':
        // Merge both versions
        const mergedData = this.mergeData(conflict.localItem.data, conflict.remoteItem.data);
        const mergedItem = { ...conflict.localItem, data: mergedData };
        await this.simulateApiCall(mergedItem.type, mergedItem);
        await this.updateLocalData(mergedItem);
        break;
    }

    await this.removeFromSyncQueue(conflict.localItem.id);
  }

  private mergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - combine unique properties
    return { ...remoteData, ...localData };
  }

  private async simulateApiCall(type: string, item: SyncItem): Promise<void> {
    // Simulate different API endpoints based on type
    const endpoints = {
      progress: '/api/progress',
      quiz_result: '/api/quiz-results',
      bookmark: '/api/bookmarks',
      note: '/api/notes',
      course_progress: '/api/course-progress'
    };

    const endpoint = endpoints[type as keyof typeof endpoints] || '/api/sync';
    
    // Simulate API call with potential failure
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`API call failed for ${endpoint}`);
    }

    // Simulate successful API response
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async updateLocalData(item: SyncItem): Promise<void> {
    // Update local storage with remote data
    if (!this.db) return;
    
    // This would typically update the main offline database
    // For now, we'll just remove the sync queue item
    await this.removeFromSyncQueue(item.id);
  }

  private async updateSyncItem(item: SyncItem): Promise<void> {
    if (!this.db) return;
    await this.db.put('syncQueue', item);
  }

  private async recordSyncHistory(result: SyncResult): Promise<void> {
    if (!this.db) return;
    
    const historyItem = {
      id: `sync-${Date.now()}`,
      timestamp: result.lastSyncTime,
      result
    };

    await this.db.put('syncHistory', historyItem);
  }

  async getSyncHistory(limit: number = 10): Promise<any[]> {
    if (!this.db) return [];
    
    const tx = this.db.transaction('syncHistory', 'readonly');
    const store = tx.objectStore('syncHistory');
    const index = store.index('timestamp');
    
    return await index.getAll(null, limit);
  }

  async getPendingConflicts(): Promise<SyncConflict[]> {
    if (!this.db) return [];
    
    const tx = this.db.transaction('conflicts', 'readonly');
    const store = tx.objectStore('conflicts');
    const index = store.index('resolved');
    
    return await index.getAll(false);
  }

  async resolveConflictManually(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    if (!this.db) return;
    
    const conflict = await this.db.get('conflicts', conflictId);
    if (conflict) {
      conflict.resolution = resolution;
      conflict.resolved = true;
      await this.db.put('conflicts', conflict);
      await this.resolveConflict(conflict);
    }
  }

  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    queueLength: number;
    lastSyncTime: Date | null;
    pendingConflicts: number;
  }> {
    const queue = await this.getSyncQueue();
    const conflicts = await this.getPendingConflicts();
    const history = await this.getSyncHistory(1);
    
    return {
      isSyncing: this.isSyncing,
      queueLength: queue.length,
      lastSyncTime: history.length > 0 ? history[0].timestamp : null,
      pendingConflicts: conflicts.length
    };
  }

  async clearSyncHistory(): Promise<void> {
    if (!this.db) return;
    await this.db.clear('syncHistory');
  }

  async exportSyncData(): Promise<string> {
    const queue = await this.getSyncQueue();
    const history = await this.getSyncHistory();
    const conflicts = await this.getPendingConflicts();
    
    const exportData = {
      queue,
      history,
      conflicts,
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importSyncData(data: string): Promise<void> {
    const importData = JSON.parse(data);
    
    if (!this.db) return;
    
    // Clear existing data
    await this.clearSyncQueue();
    await this.clearSyncHistory();
    
    // Import new data
    if (importData.queue) {
      for (const item of importData.queue) {
        await this.db.put('syncQueue', item);
      }
    }
    
    if (importData.history) {
      for (const item of importData.history) {
        await this.db.put('syncHistory', item);
      }
    }
    
    if (importData.conflicts) {
      for (const item of importData.conflicts) {
        await this.db.put('conflicts', item);
      }
    }
  }
}

// Singleton instance
let syncService: OfflineSyncService | null = null;

export const getSyncService = async (): Promise<OfflineSyncService> => {
  if (!syncService) {
    syncService = new OfflineSyncService();
    await syncService.init();
  }
  return syncService;
};

export const resetSyncService = (): void => {
  syncService = null;
};
