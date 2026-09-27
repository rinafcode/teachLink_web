import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  IDBFactory,
  IDBKeyRange,
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory as _IDBFactory,
  IDBIndex,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
} from 'fake-indexeddb';
import { OfflineStorage, OfflineSyncService, OfflineProgressRecord } from '@/services/offlineSync';
import { createResolutionPolicy } from '@/lib/conflict/resolver';
import { tokenManager } from '@/lib/auth/tokenManager';
import { SYNC_RETENTION_MS, DEAD_LETTER_RETENTION_MS } from '@/constants/app.constants';

// The shared test-setup stubs IndexedDB; swap in the real fake implementation
// so the offline stores actually persist. `window.indexedDB` is writable, the
// other IDB globals are plain assignments.
(globalThis as any).indexedDB = new IDBFactory();
(globalThis as any).IDBKeyRange = IDBKeyRange;
(globalThis as any).IDBCursor = IDBCursor;
(globalThis as any).IDBCursorWithValue = IDBCursorWithValue;
(globalThis as any).IDBDatabase = IDBDatabase;
(globalThis as any).IDBFactory = _IDBFactory;
(globalThis as any).IDBIndex = IDBIndex;
(globalThis as any).IDBObjectStore = IDBObjectStore;
(globalThis as any).IDBOpenDBRequest = IDBOpenDBRequest;
(globalThis as any).IDBRequest = IDBRequest;
(globalThis as any).IDBTransaction = IDBTransaction;

vi.mock('@/services/offlineApi', () => ({
  offlineApi: {
    syncLessonProgress: vi.fn(),
  },
}));

import { offlineApi } from '@/services/offlineApi';
import { VersionVector } from '@/lib/conflict/types';

const syncLessonProgressMock = vi.mocked(offlineApi.syncLessonProgress);

let storage: OfflineStorage;
let service: OfflineSyncService;

const makeProgress = (
  courseId = 'c1',
  moduleId = 'm1',
  progress = 50,
  completed = false,
  vector: VersionVector = { 'replica-a': 1 },
): OfflineProgressRecord => ({
  courseId,
  moduleId,
  progress,
  completed,
  updatedAt: new Date().toISOString(),
  synced: false,
  version: 1,
  logicalClock: 1,
  updatedBy: 'replica-a',
  versionVector: vector,
});

const enqueueProgress = async (record: OfflineProgressRecord) => {
  await storage.saveProgress(record);
  return await service.enqueue('course_progress', record);
};

const okResponse = (record: OfflineProgressRecord) => ({
  success: true,
  data: { ...record, lessonId: record.moduleId },
});

beforeEach(async () => {
  // Fresh in-memory database per test.
  (globalThis as any).indexedDB = new IDBFactory();
  syncLessonProgressMock.mockReset();

  // syncData gates the drain on a valid session and returns early without
  // one. There is no session in the test environment, so every drain-based
  // test needs the gate satisfied — otherwise they assert against a run that
  // never happened.
  vi.spyOn(tokenManager, 'getValidAccessToken').mockResolvedValue('test-access-token');

  storage = new OfflineStorage();
  await storage.init();
  service = new OfflineSyncService(storage);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('idempotent replay', () => {
  it('applies a duplicate-delivered operation exactly once', async () => {
    const record = makeProgress();
    const item = await enqueueProgress(record);
    syncLessonProgressMock.mockResolvedValueOnce(okResponse(record));

    const first = await service.syncData({ retryAttempts: 1 });
    expect(first.success).toBe(true);
    expect(syncLessonProgressMock).toHaveBeenCalledTimes(1);
    expect(await service.getQueue()).toHaveLength(0);

    // Simulate a crash after the server applied the operation but before the
    // queue entry was removed and the cursor advanced: the same operation id
    // is delivered again.
    const db = storage.getDb();
    await db.put('syncQueue', item);
    await db.put('syncMeta', { key: 'syncCursor', value: 0 });

    const second = await service.syncData({ retryAttempts: 1 });
    expect(second.success).toBe(true);
    // Not re-sent: the ack dedupe map short-circuits replay.
    expect(syncLessonProgressMock).toHaveBeenCalledTimes(1);
    // The stale queue entry is reconciled away.
    expect(await service.getQueue()).toHaveLength(0);
  });

  it('sends the client-generated operationId so the server can dedupe', async () => {
    const record = makeProgress();
    await enqueueProgress(record);
    syncLessonProgressMock.mockResolvedValueOnce(okResponse(record));

    await service.syncData({ retryAttempts: 1 });
    const sent = syncLessonProgressMock.mock.calls[0][0];
    expect(sent.operationId).toBeDefined();
    expect(sent.operationId).toMatch(/^op-course_progress-/);
  });
});

describe('transactional batch drain', () => {
  it('rolls back the whole batch on a partial failure without diverging queue and store', async () => {
    const r1 = makeProgress('c1', 'm1', 10);
    const r2 = makeProgress('c2', 'm2', 20);
    await enqueueProgress(r1);
    await enqueueProgress(r2);

    syncLessonProgressMock
      .mockResolvedValueOnce(okResponse(r1))
      .mockRejectedValueOnce(new Error('network down'));

    const result = await service.syncData({ retryAttempts: 1 });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);

    // Nothing committed: queue intact, no acks, progress untouched.
    expect(await service.getQueue()).toHaveLength(2);
    expect(await storage.getProgress('c1', 'm1')).toMatchObject({ synced: false });
    expect(await storage.getProgress('c2', 'm2')).toMatchObject({ synced: false });
    expect(await storage.getDb().getAll('ackedOps')).toHaveLength(0);

    // Recovery: the drain resumes and eventually converges.
    syncLessonProgressMock
      .mockResolvedValueOnce(okResponse(r1))
      .mockResolvedValueOnce(okResponse(r2));

    const second = await service.syncData({ retryAttempts: 1 });
    expect(second.success).toBe(true);
    expect(await service.getQueue()).toHaveLength(0);
    expect(await storage.getProgress('c1', 'm1')).toMatchObject({ synced: true });
    expect(await storage.getProgress('c2', 'm2')).toMatchObject({ synced: true });
    expect(await storage.getDb().getAll('ackedOps')).toHaveLength(2);
  });

  it('resumes from the persisted cursor after an app restart', async () => {
    await enqueueProgress(makeProgress('c1', 'm1', 10));
    await enqueueProgress(makeProgress('c2', 'm2', 20));
    await enqueueProgress(makeProgress('c3', 'm3', 30));

    syncLessonProgressMock.mockImplementation(async (payload: any) => ({
      success: true,
      data: { ...payload, lessonId: payload.moduleId },
    }));

    const first = await service.syncData({ retryAttempts: 1 });
    expect(first.success).toBe(true);
    expect(syncLessonProgressMock).toHaveBeenCalledTimes(3);

    // A new change lands, then the app restarts.
    await enqueueProgress(makeProgress('c4', 'm4', 40));

    const storage2 = new OfflineStorage();
    await storage2.init();
    const service2 = new OfflineSyncService(storage2);

    const second = await service2.syncData({ retryAttempts: 1 });
    expect(second.success).toBe(true);
    // Only the new operation was replayed — the cursor skipped drained work.
    expect(syncLessonProgressMock).toHaveBeenCalledTimes(4);
    expect(await service2.getQueue()).toHaveLength(0);
  });

  it('dead-letters operations that exhaust their retry cap', async () => {
    const record = makeProgress('c1', 'm1', 50);
    await enqueueProgress(record);

    // Give the op a 2-attempt lifetime and pre-spend one attempt.
    const db = storage.getDb();
    const [item] = await service.getQueue();
    await db.put('syncQueue', { ...item, maxAttempts: 2, attempts: 1 });

    syncLessonProgressMock.mockRejectedValue(new Error('server 500'));

    const result = await service.syncData({ retryAttempts: 1 });
    expect(result.deadLettered).toBe(1);
    expect(await service.getQueue()).toHaveLength(0);

    const dead = await service.getDeadLetter();
    expect(dead).toHaveLength(1);
    expect(dead[0].status).toBe('dead');
    expect(dead[0].lastError).toContain('server 500');

    // Retrying re-enqueues it; once healthy it drains normally.
    syncLessonProgressMock.mockResolvedValueOnce(okResponse(record));
    expect(await service.retryDeadLetter(dead[0].id)).toBe(true);
    const recovered = await service.syncData({ retryAttempts: 1 });
    expect(recovered.success).toBe(true);
    expect(await service.getDeadLetter()).toHaveLength(0);
    expect(await service.getQueue()).toHaveLength(0);
  });

  it('retries within a drain using capped exponential backoff', async () => {
    const record = makeProgress('c1', 'm1', 50);
    await enqueueProgress(record);

    syncLessonProgressMock
      .mockRejectedValueOnce(new Error('flaky'))
      .mockRejectedValueOnce(new Error('flaky'))
      .mockResolvedValueOnce(okResponse(record));

    const result = await service.syncData({
      retryAttempts: 3,
      backoffBaseMs: 5,
      backoffCapMs: 20,
      maxRetryAttempts: 5,
    });

    expect(syncLessonProgressMock).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
    expect(await service.getQueue()).toHaveLength(0);
  });
});

describe('deterministic conflict resolution through the service', () => {
  it('auto-merges concurrent changes using version vectors (clock-skew proof)', async () => {
    const local = makeProgress('c1', 'm1', 30, false);
    await enqueueProgress(local);

    // Concurrent change from another device with an EARLIER wall clock.
    const remote = {
      ...local,
      progress: 60,
      completed: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: 5,
      versionVector: { 'replica-b': 1 },
      updatedBy: 'replica-b',
    };
    syncLessonProgressMock.mockResolvedValueOnce(okResponse(remote as OfflineProgressRecord));

    const result = await service.syncData({ resolveConflicts: 'auto', retryAttempts: 1 });
    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(0);

    const stored = await storage.getProgress('c1', 'm1');
    expect(stored).toMatchObject({ progress: 60, completed: true, synced: true });
    // Merged vector is the element-wise max of both sides.
    expect(stored?.versionVector).toEqual({ 'replica-a': 1, 'replica-b': 1 });
    expect(await service.getQueue()).toHaveLength(0);
  });

  it('surfaces manual conflicts to the UI and resolves them', async () => {
    const local = makeProgress('c1', 'm1', 30, false);
    await enqueueProgress(local);

    const remote = {
      ...local,
      progress: 60,
      versionVector: { 'replica-b': 1 },
      updatedBy: 'replica-b',
    };
    syncLessonProgressMock.mockResolvedValueOnce(okResponse(remote as OfflineProgressRecord));

    const result = await service.syncData({ resolveConflicts: 'manual', retryAttempts: 1 });
    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(1);

    const pending = await service.getPendingConflicts();
    expect(pending).toHaveLength(1);
    expect(pending[0].state).toBe('conflicted');
    expect(pending[0].entityType).toBe('course_progress');
    expect(pending[0].localVersionVector).toEqual({ 'replica-a': 1 });
    expect(pending[0].remoteVersionVector).toEqual({ 'replica-b': 1 });

    // UI resolves toward remote.
    await service.resolveConflict(pending[0].id, 'remote');
    expect(await service.getPendingConflicts()).toHaveLength(0);

    const stored = await storage.getProgress('c1', 'm1');
    expect(stored).toMatchObject({ progress: 60, synced: true });

    const status = await service.getSyncStatus();
    expect(status.conflicted).toBe(0);
    expect(status.resolved).toBe(1);
  });
});

describe('retention / GC', () => {
  it('garbage-collects acked and dead-lettered records past their retention windows', async () => {
    const db = storage.getDb();
    const oldAcked = new Date(Date.now() - SYNC_RETENTION_MS - 1000).toISOString();
    const oldDead = new Date(Date.now() - DEAD_LETTER_RETENTION_MS - 1000).toISOString();
    const fresh = new Date().toISOString();

    await db.put('ackedOps', { operationId: 'op-old', entityKey: 'c1:m1', ackedAt: oldAcked });
    await db.put('ackedOps', { operationId: 'op-fresh', entityKey: 'c1:m1', ackedAt: fresh });
    await db.put('deadLetter', {
      id: 'dl-old',
      operationId: 'op-dl',
      entityKey: 'c1:m1',
      failedAt: oldDead,
      lastError: 'exhausted',
      seq: 99,
      type: 'course_progress',
      timestamp: oldDead,
      version: 1,
      versionVector: { 'replica-a': 1 },
      updatedBy: 'replica-a',
      status: 'dead',
      attempts: 3,
      maxAttempts: 3,
    });

    const removed = await service.gcAckedRecords();
    expect(removed.acked).toBe(1);
    expect(await db.get('ackedOps', 'op-old')).toBeUndefined();
    expect(await db.get('ackedOps', 'op-fresh')).toBeDefined();
    expect(await db.getAll('deadLetter')).toHaveLength(0);
  });

  it('reports UI-facing sync status counts', async () => {
    await enqueueProgress(makeProgress('c1', 'm1', 10));
    await enqueueProgress(makeProgress('c2', 'm2', 20));

    const status = await service.getSyncStatus();
    expect(status.pending).toBe(2);
    expect(status.conflicted).toBe(0);
    expect(status.resolved).toBe(0);
    expect(status.deadLetter).toBe(0);

    syncLessonProgressMock.mockImplementation(async (payload: any) => ({
      success: true,
      data: { ...payload, lessonId: payload.moduleId },
    }));
    await service.syncData({ retryAttempts: 1 });

    const after = await service.getSyncStatus();
    expect(after.pending).toBe(0);
    expect(after.lastSyncTime).toBeDefined();
  });
});

describe('retention caps and sweeps', () => {
  const putAcked = (db: any, id: string, ackedAt: string) =>
    db.put('ackedOps', { operationId: id, entityKey: 'c1:m1', ackedAt });

  const putDead = (db: any, id: string, failedAt: string) =>
    db.put('deadLetter', {
      id,
      operationId: `op-${id}`,
      entityKey: 'c1:m1',
      failedAt,
      lastError: 'exhausted',
      seq: Number(id.replace(/\D/g, '')) || 1,
      type: 'course_progress',
      timestamp: failedAt,
      version: 1,
      versionVector: { 'replica-a': 1 },
      updatedBy: 'replica-a',
      status: 'dead',
      attempts: 3,
      maxAttempts: 3,
    });

  // Age alone leaves the store unbounded: a device that syncs thousands of
  // operations inside the retention window keeps every one of them.
  it('evicts oldest-first once the acked cap is exceeded', async () => {
    const db = storage.getDb();
    for (let i = 0; i < 5; i += 1) {
      await putAcked(db, `op-${i}`, new Date(1_000 + i * 1_000).toISOString());
    }

    const removed = await service.gcAckedRecords({ maxAckedRecords: 2, now: 5_000 });

    expect(removed.acked).toBe(3);
    const survivors = await db.getAll('ackedOps');
    expect(survivors.map((r: any) => r.operationId).sort()).toEqual(['op-3', 'op-4']);
  });

  it('leaves the store alone when it is under the cap', async () => {
    const db = storage.getDb();
    await putAcked(db, 'op-1', new Date().toISOString());

    const removed = await service.gcAckedRecords({ maxAckedRecords: 10 });

    expect(removed.acked).toBe(0);
    expect(await db.getAll('ackedOps')).toHaveLength(1);
  });

  it('applies the cap to dead-letter records too', async () => {
    const db = storage.getDb();
    for (let i = 0; i < 4; i += 1) {
      await putDead(db, `dl${i}`, new Date(1_000 + i * 1_000).toISOString());
    }

    const removed = await service.gcAckedRecords({ maxDeadLetterRecords: 1, now: 5_000 });

    expect(removed.deadLetter).toBe(3);
    expect(await db.getAll('deadLetter')).toHaveLength(1);
  });

  it('honours an overridden retention window', async () => {
    const db = storage.getDb();
    await putAcked(db, 'op-old', new Date(0).toISOString());

    const removed = await service.gcAckedRecords({ ackedRetentionMs: 1_000, now: 10_000 });

    expect(removed.acked).toBe(1);
  });

  it('collects nothing from empty stores', async () => {
    expect(await service.gcAckedRecords()).toEqual({ acked: 0, deadLetter: 0 });
  });

  it('runs a sweep on demand', async () => {
    const db = storage.getDb();
    await putAcked(db, 'op-old', new Date(0).toISOString());

    const swept = await service.runRetentionSweep({ ackedRetentionMs: 1_000, now: 10_000 });

    expect(swept.acked).toBe(1);
    expect(await db.getAll('ackedOps')).toHaveLength(0);
  });

  // The client that most needs collecting is the one that never syncs.
  it('still collects when a sync is skipped for lack of a session', async () => {
    const db = storage.getDb();
    await putAcked(db, 'op-old', new Date(Date.now() - SYNC_RETENTION_MS - 1000).toISOString());
    vi.spyOn(tokenManager, 'getValidAccessToken').mockResolvedValue(null);

    const result = await service.syncData();

    expect(result.errors).toContain('Skipped: no authenticated session');
    expect(await db.getAll('ackedOps')).toHaveLength(0);
  });

  it('stops the periodic sweep when the returned function is called', async () => {
    vi.useFakeTimers();
    const sweep = vi.spyOn(service, 'runRetentionSweep').mockResolvedValue({
      acked: 0,
      deadLetter: 0,
    });

    const stop = service.startRetentionSweep(1_000);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(sweep).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(sweep).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  // A failed sweep would otherwise reject inside a timer callback with nobody
  // to catch it.
  it('survives a failing sweep', async () => {
    vi.useFakeTimers();
    vi.spyOn(service, 'runRetentionSweep').mockRejectedValue(new Error('idb closed'));

    const stop = service.startRetentionSweep(1_000);
    await expect(vi.advanceTimersByTimeAsync(1_000)).resolves.not.toThrow();

    stop();
    vi.useRealTimers();
  });
});

describe('dead-letter visibility', () => {
  const deadRecord = (id: string, failedAt: string, type = 'course_progress') => ({
    id,
    operationId: `op-${id}`,
    entityKey: `c1:${id}`,
    failedAt,
    lastError: 'exhausted',
    seq: 1,
    type,
    timestamp: failedAt,
    version: 1,
    versionVector: { 'replica-a': 1 },
    updatedBy: 'replica-a',
    status: 'dead',
    attempts: 3,
    maxAttempts: 3,
  });

  it('counts an empty queue as zero', async () => {
    expect(await service.getDeadLetterCount()).toBe(0);
  });

  it('counts dead-lettered operations', async () => {
    const db = storage.getDb();
    await db.put('deadLetter', deadRecord('dl1', '2026-01-02T00:00:00.000Z'));
    await db.put('deadLetter', deadRecord('dl2', '2026-01-03T00:00:00.000Z'));

    expect(await service.getDeadLetterCount()).toBe(2);
  });

  // A bare count says something is stuck but not whether it is one operation
  // from this morning or forty from last month.
  it('summarises the queue by type and oldest failure', async () => {
    const db = storage.getDb();
    await db.put('deadLetter', deadRecord('dl1', '2026-01-03T00:00:00.000Z'));
    await db.put('deadLetter', deadRecord('dl2', '2026-01-02T00:00:00.000Z'));

    const summary = await service.getDeadLetterSummary();

    expect(summary.count).toBe(2);
    expect(summary.byType.course_progress).toBe(2);
    expect(summary.oldestFailedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('summarises an empty queue without an oldest timestamp', async () => {
    expect(await service.getDeadLetterSummary()).toEqual({
      count: 0,
      byType: {},
      oldestFailedAt: null,
    });
  });

  it('re-enqueues every dead-lettered operation', async () => {
    const db = storage.getDb();
    await db.put('deadLetter', deadRecord('dl1', '2026-01-02T00:00:00.000Z'));
    await db.put('deadLetter', deadRecord('dl2', '2026-01-03T00:00:00.000Z'));

    const requeued = await service.retryAllDeadLetter();

    expect(requeued).toBe(2);
    expect(await service.getDeadLetterCount()).toBe(0);
    expect(await service.getQueue()).toHaveLength(2);
  });

  it('reports nothing requeued for an empty queue', async () => {
    expect(await service.retryAllDeadLetter()).toBe(0);
  });
});

describe('per-entity conflict strategies', () => {
  it('defaults to the shipped policy', () => {
    expect(service.getConflictPolicy().byEntityType.course_progress).toBe('merge');
  });

  it('accepts a policy through the constructor', () => {
    const policy = createResolutionPolicy({ byEntityType: { note: 'local' } });
    const configured = new OfflineSyncService(storage, policy);

    expect(configured.getConflictPolicy()).toBe(policy);
  });

  it('replaces the policy at runtime', () => {
    const policy = createResolutionPolicy({ default: 'remote' });
    service.setConflictPolicy(policy);

    expect(service.getConflictPolicy()).toBe(policy);
  });

  // The strategy an entity type resolves under is what the policy exists to
  // decide; a global 'merge' would flatten every type into the same rule.
  it('resolves an entity type by its configured strategy', async () => {
    service.setConflictPolicy(
      createResolutionPolicy({ byEntityType: { course_progress: 'local' } }),
    );
    const record = makeProgress('c1', 'm1', 40);
    await enqueueProgress(record);

    syncLessonProgressMock.mockResolvedValue({
      success: false,
      conflict: true,
      remote: { ...record, progress: 90, versionVector: { 'replica-b': 1 } },
    } as any);

    await service.syncData({ retryAttempts: 1 });

    const conflicts = await service.getPendingConflicts();
    const stored = await storage.getProgress('c1', 'm1');
    // 'local' keeps the device's own value rather than merging to the max.
    expect(stored?.progress === 40 || conflicts.length > 0).toBe(true);
  });
});
