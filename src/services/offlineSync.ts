'use client';

import { openDB, IDBPDatabase, IDBPObjectStore } from 'idb';
import {
  ConflictRecord,
  ResolutionStrategy,
  VersionVector,
  detectConflict,
  resolveConflict,
  createConflictRecord,
  mergeVersionVectors,
} from '@/lib/conflict/resolver';
import {
  SYNC_BATCH_SIZE,
  SYNC_MAX_RETRY_ATTEMPTS,
  SYNC_BACKOFF_BASE_MS,
  SYNC_BACKOFF_CAP_MS,
  SYNC_RETENTION_MS,
  DEAD_LETTER_RETENTION_MS,
} from '@/constants/app.constants';
import { offlineApi } from './offlineApi';

export type SyncItemType = 'course_progress';

export type SyncItemStatus = 'pending' | 'conflicted' | 'dead' | 'acked';

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
  version?: number;
  /** Replica/device that produced the last local change. */
  updatedBy?: string;
  /** Lamport logical clock — monotonic, immune to wall-clock drift. */
  logicalClock?: number;
  /** Per-record version vector for deterministic conflict detection. */
  versionVector?: VersionVector;
}

export interface SyncQueueItem {
  /** Internal queue id. */
  id: string;
  /** Client-generated idempotency key sent to the server for dedupe. */
  operationId: string;
  /** Monotonic sequence number used by the resumable drain cursor. */
  seq: number;
  type: SyncItemType;
  entityKey: string;
  data: any;
  timestamp: string;
  version: number;
  versionVector: VersionVector;
  updatedBy: string;
  status: SyncItemStatus;
  /** Delivery attempts so far (persisted across restarts). */
  attempts: number;
  /** Lifetime delivery cap before the operation is dead-lettered. */
  maxAttempts: number;
  lastError?: string;
}

export interface DeadLetterRecord extends SyncQueueItem {
  failedAt: string;
  lastError: string;
}

export type SyncConflict = ConflictRecord<any>;

/** UI-facing sync status derived from the offline stores. */
export interface SyncStatus {
  isSyncing: boolean;
  pending: number;
  conflicted: number;
  resolved: number;
  deadLetter: number;
  lastSyncTime: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflicts: SyncConflict[];
  errors: string[];
  lastSyncTime: string;
  /** Number of operations resolved automatically (merge/local/remote). */
  resolved?: number;
  /** Number of operations moved to the dead-letter queue. */
  deadLettered?: number;
  /** Drain cursor position after this run (for observability). */
  cursor?: number;
}

export interface SyncOptions {
  forceSync?: boolean;
  resolveConflicts?: 'auto' | ResolutionStrategy;
  retryAttempts?: number;
  /** Lifetime delivery cap per operation (defaults to SYNC_MAX_RETRY_ATTEMPTS). */
  maxRetryAttempts?: number;
  batchSize?: number;
  backoffBaseMs?: number;
  backoffCapMs?: number;
}

export const OFFLINE_DB_NAME = 'teachlink-offline';
export const OFFLINE_DB_VERSION = 3;

const ensureBrowser = () => {
  if (typeof window === 'undefined') {
    throw new Error('Offline storage is only available in the browser');
  }
};

const createEntityKey = (_type: SyncItemType, data: unknown) => {
  if (typeof data === 'object' && data !== null && 'courseId' in data && 'moduleId' in data) {
    return `${(data as { courseId: string; moduleId: string }).courseId}:${
      (data as { courseId: string; moduleId: string }).moduleId
    }`;
  }
  throw new Error('Invalid data structure for entity key');
};

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const generateOperationId = (type: SyncItemType): string =>
  `op-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Backfills legacy v2 queue records with the fields required for idempotent,
 * cursor-based draining (operationId, seq, status, attempts, version vector).
 */
async function migrateLegacyQueueItems(queueStore: any): Promise<void> {
  const replicaId = `replica-${Math.random().toString(36).slice(2, 10)}`;
  let seq = 1;
  let cursor = await queueStore.openCursor();
  while (cursor) {
    const record = cursor.value as Partial<SyncQueueItem>;
    await cursor.update({
      ...record,
      operationId: record.operationId ?? record.id ?? generateOperationId('course_progress'),
      seq: record.seq ?? seq++,
      status: record.status ?? 'pending',
      attempts: record.attempts ?? 0,
      maxAttempts: record.maxAttempts ?? SYNC_MAX_RETRY_ATTEMPTS,
      updatedBy: record.updatedBy ?? replicaId,
      versionVector:
        record.versionVector ??
        (record.version ? { [replicaId]: record.version } : { [replicaId]: 1 }),
    });
    cursor = await cursor.continue();
  }
}

/** Reads the persisted cursor / seq / replica metadata. */
const META_CURSOR = 'syncCursor';
const META_LAST_SEQ = 'lastSeq';
const META_REPLICA_ID = 'replicaId';

export class OfflineStorage {
  private db: IDBPDatabase | null = null;

  async init(): Promise<void> {
    ensureBrowser();
    this.db = await openDB(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
      upgrade: async (db, _oldVersion, _newVersion, transaction) => {
        // NOTE: object stores must be created synchronously, before any await.
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
          const progressStore = db.createObjectStore('progress', {
            keyPath: ['courseId', 'moduleId'],
          });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
          progressStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('entityKey', 'entityKey', { unique: false });
          syncStore.createIndex('seq', 'seq', { unique: true });
          syncStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
          conflictStore.createIndex('entityKey', 'entityKey', { unique: false });
          conflictStore.createIndex('state', 'state', { unique: false });
        }

        // Metadata: drain cursor, sequence counter, replica id, ack timestamps.
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'key' });
        }

        // Dedupe map: operationId -> ack. Makes replay idempotent.
        if (!db.objectStoreNames.contains('ackedOps')) {
          const ackedStore = db.createObjectStore('ackedOps', { keyPath: 'operationId' });
          ackedStore.createIndex('ackedAt', 'ackedAt', { unique: false });
        }

        // Dead-letter queue for operations that exhausted their retries.
        if (!db.objectStoreNames.contains('deadLetter')) {
          const deadStore = db.createObjectStore('deadLetter', { keyPath: 'id' });
          deadStore.createIndex('failedAt', 'failedAt', { unique: false });
        }

        // Migrate legacy v2 queue items so they gain idempotency fields and a
        // sequence number; without this the resumable cursor would skip them.
        if (_oldVersion < 3 && db.objectStoreNames.contains('syncQueue')) {
          await migrateLegacyQueueItems(transaction.objectStore('syncQueue'));
        }
      },
    });
  }

  getDb(): IDBPDatabase {
    if (!this.db) {
      throw new Error('Offline database not initialized');
    }
    return this.db;
  }

  /** Stable per-device replica id used for version vectors and conflict detection. */
  async getReplicaId(): Promise<string> {
    const db = this.getDb();
    const existing = await db.get('syncMeta', META_REPLICA_ID);
    if (existing) return existing.value as string;
    const replicaId = `replica-${Math.random().toString(36).slice(2, 10)}`;
    await db.put('syncMeta', { key: META_REPLICA_ID, value: replicaId });
    return replicaId;
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

  async getProgress(
    courseId: string,
    moduleId: string,
  ): Promise<OfflineProgressRecord | undefined> {
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
    return await index.getAll(false as unknown as IDBValidKey);
  }

  async markProgressSynced(courseId: string, moduleId: string, syncedAt: string): Promise<void> {
    const existing = await this.getProgress(courseId, moduleId);
    if (!existing) return;

    const updated = {
      ...existing,
      synced: true,
      syncedAt,
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
    await db.clear('syncMeta');
    await db.clear('ackedOps');
    await db.clear('deadLetter');
  }

  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const db = this.getDb();
    const courses = await db.getAll('courses');
    const assets = await db.getAll('assets');
    const progress = await db.getAll('progress');
    const syncQueue = await db.getAll('syncQueue');
    const deadLetter = await db.getAll('deadLetter');

    const used =
      courses.reduce(
        (acc: number, course: { sizeBytes?: number }) => acc + (course.sizeBytes || 0),
        0,
      ) +
      assets.reduce(
        (acc: number, asset: { sizeBytes?: number }) => acc + (asset.sizeBytes || 0),
        0,
      ) +
      progress.length * 1024 +
      syncQueue.length * 512 +
      deadLetter.length * 512;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      return { used, total, percentage };
    }

    return { used, total: 0, percentage: 0 };
  }
}

interface BatchOutcome {
  success: boolean;
  syncedItems: number;
  conflicts: SyncConflict[];
  errors: string[];
  deadLettered: number;
}

interface ItemAttempt {
  item: SyncQueueItem;
  ok: boolean;
  acked?: boolean;
  dead?: boolean;
  response?: Awaited<ReturnType<typeof offlineApi.syncLessonProgress>>;
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

  // -------------------------------------------------------------------------
  // Queue management
  // -------------------------------------------------------------------------

  async enqueue(type: SyncItemType, data: any): Promise<SyncQueueItem> {
    const replicaId = await this.storage.getReplicaId();
    const seq = await this.nextSeq();
    const operationId = generateOperationId(type);

    const item: SyncQueueItem = {
      id: generateId('sync'),
      operationId,
      seq,
      type,
      entityKey: createEntityKey(type, data),
      data: {
        ...data,
        operationId,
        updatedBy: data.updatedBy ?? replicaId,
      },
      timestamp: new Date().toISOString(),
      version: data.version ?? 1,
      versionVector:
        (data.versionVector as VersionVector | undefined) ?? { [replicaId]: 1 },
      updatedBy: replicaId,
      status: 'pending',
      attempts: 0,
      maxAttempts: SYNC_MAX_RETRY_ATTEMPTS,
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

  async removeQueueItemsForEntity(entityKey: string): Promise<void> {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const index = tx.objectStore('syncQueue').index('entityKey');
    const items = await index.getAll(entityKey);
    for (const item of items) {
      await tx.objectStore('syncQueue').delete(item.id);
    }
    await tx.done;
  }

  async clearQueue(): Promise<void> {
    await this.db.clear('syncQueue');
  }

  // -------------------------------------------------------------------------
  // Dead-letter queue
  // -------------------------------------------------------------------------

  async getDeadLetter(): Promise<DeadLetterRecord[]> {
    return await this.db.getAll('deadLetter');
  }

  async getDeadLetterCount(): Promise<number> {
    return (await this.db.getAll('deadLetter')).length;
  }

  /** Re-enqueue a dead-lettered operation for another sync attempt. */
  async retryDeadLetter(id: string): Promise<boolean> {
    const record = await this.db.get('deadLetter', id);
    if (!record) return false;

    const { failedAt: _failedAt, lastError: _lastError, ...rest } = record;
    const tx = this.db.transaction(['deadLetter', 'syncQueue', 'syncMeta'], 'readwrite');
    const metaStore = tx.objectStore('syncMeta');
    const meta = await metaStore.get(META_LAST_SEQ);
    const next = (typeof meta?.value === 'number' ? meta.value : 0) + 1;
    await metaStore.put({ key: META_LAST_SEQ, value: next });
    await tx.objectStore('deadLetter').delete(id);
    // Fresh sequence number so the retry sits after the drain cursor.
    await tx.objectStore('syncQueue').put({
      ...rest,
      status: 'pending',
      attempts: 0,
      seq: next,
    });
    await tx.done;
    return true;
  }

  // -------------------------------------------------------------------------
  // Conflicts
  // -------------------------------------------------------------------------

  private async addConflict(conflict: SyncConflict): Promise<void> {
    await this.db.put('conflicts', conflict);
  }

  async getPendingConflicts(): Promise<SyncConflict[]> {
    const conflicts = await this.db.getAll('conflicts');
    return conflicts.filter((conflict) => !conflict.resolved);
  }

  async resolveConflict(
    conflictId: string,
    strategy: ResolutionStrategy,
    manualData?: any,
  ): Promise<void> {
    const conflict = await this.db.get('conflicts', conflictId);
    if (!conflict) return;

    const resolvedData =
      strategy === 'manual' && manualData
        ? manualData
        : resolveConflict(conflict.localData, conflict.remoteData, strategy, conflict.entityType);

    const replicaId = await this.storage.getReplicaId();
    const resolvedConflict: SyncConflict = {
      ...conflict,
      strategy,
      resolved: true,
      state: 'resolved',
      history: [
        ...conflict.history,
        {
          timestamp: new Date().toISOString(),
          action: 'RESOLVED',
          details: `Resolved using ${strategy} strategy`,
        },
      ],
    };

    const tx = this.db.transaction(['conflicts', 'progress', 'syncQueue', 'ackedOps'], 'readwrite');
    await tx.objectStore('conflicts').put(resolvedConflict);

    const [courseId, moduleId] = conflict.entityKey.split(':');
    await tx.objectStore('progress').put({
      courseId,
      moduleId,
      ...resolvedData,
      versionVector: mergeVersionVectors(
        (resolvedData?.versionVector as VersionVector | undefined) ?? {},
        { [replicaId]: 1 },
      ),
      updatedBy: replicaId,
      synced: true,
      syncedAt: new Date().toISOString(),
    });

    // Drop any queued operations for this entity and ack them so they are never
    // replayed after a manual resolution.
    const queueIndex = tx.objectStore('syncQueue').index('entityKey');
    const queued = await queueIndex.getAll(conflict.entityKey);
    for (const item of queued) {
      await tx.objectStore('ackedOps').put({
        operationId: item.operationId,
        entityKey: item.entityKey,
        ackedAt: new Date().toISOString(),
      });
      await tx.objectStore('syncQueue').delete(item.id);
    }
    await tx.done;
  }

  // -------------------------------------------------------------------------
  // Sync status (UI-facing deterministic conflict state)
  // -------------------------------------------------------------------------

  async getSyncStatus(): Promise<SyncStatus> {
    const [queue, conflicts, deadLetter] = await Promise.all([
      this.db.getAll('syncQueue'),
      this.db.getAll('conflicts'),
      this.db.getAll('deadLetter'),
    ]);

    const pending = queue.filter((item) => item.status === 'pending').length;
    const conflicted = conflicts.filter((c) => c.state === 'conflicted').length;
    const resolved = conflicts.filter((c) => c.state === 'resolved').length;
    const lastSyncMeta = await this.db.get('syncMeta', 'lastSyncTime');

    return {
      isSyncing: this.isSyncing,
      pending,
      conflicted,
      resolved,
      deadLetter: deadLetter.length,
      lastSyncTime: (lastSyncMeta?.value as string | null) ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // Resumable cursor + sequence numbers
  // -------------------------------------------------------------------------

  private async getCursor(): Promise<number> {
    const meta = await this.db.get('syncMeta', META_CURSOR);
    return typeof meta?.value === 'number' ? meta.value : 0;
  }

  private async advanceCursor(seq: number): Promise<void> {
    const tx = this.db.transaction('syncMeta', 'readwrite');
    await tx.objectStore('syncMeta').put({ key: META_CURSOR, value: seq });
    await tx.objectStore('syncMeta').put({
      key: 'lastSyncTime',
      value: new Date().toISOString(),
    });
    await tx.done;
  }

  private async nextSeq(): Promise<number> {
    const tx = this.db.transaction('syncMeta', 'readwrite');
    const store = tx.objectStore('syncMeta');
    const meta = await store.get(META_LAST_SEQ);
    const next = (typeof meta?.value === 'number' ? meta.value : 0) + 1;
    await store.put({ key: META_LAST_SEQ, value: next });
    await tx.done;
    return next;
  }

  /**
   * Loads the next batch of pending operations strictly after the cursor.
   * Because the cursor is persisted, a drain interrupted by a crash/restart
   * resumes exactly where it left off instead of re-processing history.
   */
  private async loadBatch(cursor: number, batchSize: number): Promise<SyncQueueItem[]> {
    const queue = await this.db.getAll('syncQueue');
    return queue
      .filter((item) => item.status === 'pending' && item.seq > cursor)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, batchSize);
  }

  // -------------------------------------------------------------------------
  // Idempotency helpers
  // -------------------------------------------------------------------------

  private async isAcked(operationId: string): Promise<boolean> {
    return Boolean(await this.db.get('ackedOps', operationId));
  }

  // -------------------------------------------------------------------------
  // Retention / GC for acked + dead-lettered records
  // -------------------------------------------------------------------------

  /** Removes acked ops and dead-letter records older than their retention windows. */
  async gcAckedRecords(): Promise<{ acked: number; deadLetter: number }> {
    const now = Date.now();
    const tx = this.db.transaction(['ackedOps', 'deadLetter'], 'readwrite');
    const ackedStore = tx.objectStore('ackedOps');
    const deadStore = tx.objectStore('deadLetter');

    const ackedIndex = ackedStore.index('ackedAt');
    let ackedCursor = await ackedIndex.openCursor();
    let ackedRemoved = 0;
    while (ackedCursor) {
      const record = ackedCursor.value as { ackedAt: string };
      if (now - new Date(record.ackedAt).getTime() > SYNC_RETENTION_MS) {
        await ackedCursor.delete();
        ackedRemoved += 1;
      }
      ackedCursor = await ackedCursor.continue();
    }

    const deadIndex = deadStore.index('failedAt');
    let deadCursor = await deadIndex.openCursor();
    let deadRemoved = 0;
    while (deadCursor) {
      const record = deadCursor.value as { failedAt: string };
      if (now - new Date(record.failedAt).getTime() > DEAD_LETTER_RETENTION_MS) {
        await deadCursor.delete();
        deadRemoved += 1;
      }
      deadCursor = await deadCursor.continue();
    }

    await tx.done;
    return { acked: ackedRemoved, deadLetter: deadRemoved };
  }

  // -------------------------------------------------------------------------
  // Deterministic, idempotent, transactional sync
  // -------------------------------------------------------------------------

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
      lastSyncTime: new Date().toISOString(),
      resolved: 0,
      deadLettered: 0,
      cursor: 0,
    };

    try {
      await this.gcAckedRecords();

      const batchSize = options.batchSize ?? SYNC_BATCH_SIZE;
      let cursor = await this.getCursor();

      for (;;) {
        const batch = await this.loadBatch(cursor, batchSize);
        if (batch.length === 0) break;

        const outcome = await this.drainBatch(batch, options);
        result.syncedItems += outcome.syncedItems;
        result.conflicts.push(...outcome.conflicts);
        result.errors.push(...outcome.errors);
        result.deadLettered = (result.deadLettered ?? 0) + outcome.deadLettered;
        result.resolved = (result.resolved ?? 0) + outcome.syncedItems;

        if (!outcome.success) break;

        // Commit point: the whole batch drained, so the cursor can advance.
        const lastSeq = batch[batch.length - 1].seq;
        cursor = lastSeq;
        await this.advanceCursor(lastSeq);
        result.cursor = cursor;
      }

      result.success = result.errors.length === 0;
      result.lastSyncTime = new Date().toISOString();
    } catch (error) {
      result.errors.push(`Sync failed: ${String(error)}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Drains a single batch all-or-nothing.
   *
   * - Every operation is attempted with capped exponential backoff.
   * - Operations that exhaust their lifetime retry cap are dead-lettered and
   *   do not block the batch.
   * - If a non-exhausted operation still fails, the ENTIRE batch is rolled
   *   back: no queue deletions, no acks, no progress-store writes. The cursor
   *   stays put, so the next drain (after restart or connectivity) resumes
   *   from exactly this batch.
   */
  private async drainBatch(batch: SyncQueueItem[], options: SyncOptions): Promise<BatchOutcome> {
    const outcomes: BatchOutcome = {
      success: false,
      syncedItems: 0,
      conflicts: [],
      errors: [],
      deadLettered: 0,
    };

    const attempts: ItemAttempt[] = [];

    for (const item of batch) {
      // Idempotent replay: an already-acked operation is never re-sent.
      if (await this.isAcked(item.operationId)) {
        attempts.push({ item, ok: true, acked: true });
        continue;
      }

      const attempt = await this.attemptWithBackoff(item, options);

      if (attempt.ok) {
        attempts.push(attempt);
        continue;
      }

      // Persist the incremented attempt count for the retry lifecycle.
      await this.updateItemAttempts(item, attempt.attempts ?? item.attempts, attempt.error);

      const retryCap = options.maxRetryAttempts ?? item.maxAttempts;
      if ((attempt.attempts ?? item.attempts) >= retryCap) {
        // Exhausted: move to the dead-letter queue and keep draining the batch.
        await this.deadLetter(item, attempt.error);
        outcomes.deadLettered += 1;
        continue;
      }

      // Transient failure that has not exhausted retries: roll the whole batch
      // back and stop. Nothing above is committed.
      outcomes.errors.push(
        `Failed to sync operation ${item.operationId} (${item.entityKey}): ${attempt.error}`,
      );
      return outcomes;
    }

    // All-or-nothing commit inside a single IndexedDB transaction.
    await this.commitBatch(attempts, options, outcomes);
    outcomes.success = true;
    return outcomes;
  }

  /**
   * Attempts a single operation with capped exponential backoff between
   * retries (default: SYNC_MAX_RETRY_ATTEMPTS attempts per drain).
   */
  private async attemptWithBackoff(
    item: SyncQueueItem,
    options: SyncOptions,
  ): Promise<ItemAttempt & { attempts: number; error?: string }> {
    const retryAttempts = options.retryAttempts ?? 2;
    const baseMs = options.backoffBaseMs ?? SYNC_BACKOFF_BASE_MS;
    const capMs = options.backoffCapMs ?? SYNC_BACKOFF_CAP_MS;

    let attempts = item.attempts;
    let lastError: string | undefined;

    for (let i = 0; i < retryAttempts; i++) {
      attempts += 1;
      try {
        const response = await offlineApi.syncLessonProgress(item.data);
        return { item, ok: true, response, attempts };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (i < retryAttempts - 1) {
          const backoff = Math.min(capMs, baseMs * Math.pow(2, i));
          await delay(backoff);
        }
      }
    }

    return { item, ok: false, error: lastError, attempts };
  }

  private async updateItemAttempts(
    item: SyncQueueItem,
    attempts: number,
    error?: string,
  ): Promise<void> {
    const updated: SyncQueueItem = {
      ...item,
      attempts,
      status: 'pending',
    };
    if (error !== undefined) {
      updated.lastError = error;
    }
    await this.db.put('syncQueue', updated);
  }

  private async deadLetter(item: SyncQueueItem, error?: string): Promise<void> {
    const tx = this.db.transaction(['deadLetter', 'syncQueue'], 'readwrite');
    await tx.objectStore('deadLetter').put({
      ...item,
      status: 'dead',
      failedAt: new Date().toISOString(),
      lastError: error ?? item.lastError ?? 'Max retries exceeded',
    });
    await tx.objectStore('syncQueue').delete(item.id);
    await tx.done;
  }

  /**
   * Commits a fully-successful batch atomically: acks are recorded, queue
   * items removed, progress reconciled with deterministic conflict handling.
   */
  private async commitBatch(
    attempts: ItemAttempt[],
    options: SyncOptions,
    outcome: BatchOutcome,
  ): Promise<void> {
    const db = this.db;
    const tx = db.transaction(
      ['syncQueue', 'ackedOps', 'progress', 'conflicts'],
      'readwrite',
    );
    const queueStore = tx.objectStore('syncQueue');
    const ackStore = tx.objectStore('ackedOps');
    const progressStore = tx.objectStore('progress');
    const conflictStore = tx.objectStore('conflicts');
    const now = new Date().toISOString();

    for (const attempt of attempts) {
      const { item } = attempt;

      await ackStore.put({
        operationId: item.operationId,
        entityKey: item.entityKey,
        ackedAt: now,
      });

      if (attempt.acked) {
        // Already applied server-side; just drop the stale queue entry.
        await queueStore.delete(item.id);
        continue;
      }

      const remoteData = attempt.response?.data ?? item.data;
      const [courseId, moduleId] = item.entityKey.split(':');
      const existing = await progressStore.get([courseId, moduleId]);

      const conflicted =
        existing && detectConflict(existing, remoteData) && attempt.response?.success !== false;

      if (conflicted) {
        const strategy = this.resolveConflictStrategy(
          {
            entityType: item.type,
            entityKey: item.entityKey,
            localData: existing,
            remoteData,
          } as SyncConflict,
          options,
        );

        if (strategy === 'manual') {
          const conflict = createConflictRecord(item.type, item.entityKey, existing, remoteData);
          await conflictStore.put(conflict);
          await queueStore.delete(item.id);
          outcome.conflicts.push(conflict);
        } else {
          const resolved = resolveConflict(existing, remoteData, strategy, item.type);
          await progressStore.put({
            courseId,
            moduleId,
            ...resolved,
            synced: true,
            syncedAt: now,
          });
          await queueStore.delete(item.id);
          outcome.syncedItems += 1;
        }
      } else {
        await progressStore.put({
          courseId,
          moduleId,
          progress: remoteData.progress,
          completed: remoteData.completed,
          updatedAt: remoteData.updatedAt,
          version: remoteData.version,
          logicalClock: remoteData.logicalClock,
          updatedBy: remoteData.updatedBy,
          versionVector: mergeVersionVectors(
            (remoteData.versionVector as VersionVector | undefined) ?? {},
            (existing?.versionVector as VersionVector | undefined) ?? {},
          ),
          synced: true,
          syncedAt: now,
        });
        await queueStore.delete(item.id);
        outcome.syncedItems += 1;
      }
    }

    await tx.done;
  }

  private resolveConflictStrategy(
    conflict: SyncConflict,
    options: SyncOptions,
  ): ResolutionStrategy {
    if (
      options.resolveConflicts === 'local' ||
      options.resolveConflicts === 'remote' ||
      options.resolveConflicts === 'merge'
    ) {
      return options.resolveConflicts as ResolutionStrategy;
    }

    if (options.resolveConflicts === 'manual') {
      return 'manual';
    }

    // Default auto strategy: deterministically merge progress payloads.
    return 'merge';
  }
}
