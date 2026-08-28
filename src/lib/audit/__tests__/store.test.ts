import { describe, expect, it, vi, beforeEach } from 'vitest';

const { insertMock, findManyMock } = vi.hoisted(() => ({
  insertMock: vi.fn().mockResolvedValue(undefined),
  findManyMock: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
}));

vi.mock('@/lib/db/repositories/audit-log.repository', () => ({
  insert: insertMock,
  findMany: findManyMock,
}));

import { appendAuditLog, queryAuditLogs, queryAuditLog, getAuditStoreSnapshot } from '../store';

vi.mock('@/lib/audit', () => ({
  appendAuditLog,
  queryAuditLogs,
  queryAuditLog,
  getAuditStoreSnapshot,
}));

const baseInput = {
  actorId: 'user_1',
  action: 'create' as const,
  targetType: 'video-note',
  targetId: 'note_abc',
  path: '/api/notes',
  method: 'POST',
  ip: '127.0.0.1',
  userAgent: 'vitest',
  statusCode: 201,
};

function flushSetImmediate(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('audit store', () => {
  beforeEach(() => {
    insertMock.mockClear();
    findManyMock.mockClear();
  });

  it('appends a log entry with correct fields', () => {
    const entry = appendAuditLog(baseInput);
    expect(entry.id).toMatch(/^audit_/);
    expect(entry.action).toBe('create');
    expect(entry.method).toBe('POST');
  });

  it('returns filtered results by action', () => {
    appendAuditLog({ ...baseInput, action: 'delete', targetId: 'note_del' });
    const { entries } = queryAuditLogs({ action: 'delete' });
    expect(entries.every((e) => e.action === 'delete')).toBe(true);
  });

  it('returns filtered results by search term', () => {
    appendAuditLog({ ...baseInput, targetId: 'unique_search_target' });
    const { entries } = queryAuditLogs({ search: 'unique_search_target' });
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].targetId).toBe('unique_search_target');
  });

  it('respects limit', () => {
    const { entries } = queryAuditLogs({ limit: 1 });
    expect(entries.length).toBeLessThanOrEqual(1);
  });

  it('caps the in-memory buffer at 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      appendAuditLog({ ...baseInput, targetId: `bulk_${i}` });
    }
    expect(getAuditStoreSnapshot().length).toBeLessThanOrEqual(50);
  });

  it('asynchronously persists every appended entry to the database', async () => {
    const entry = appendAuditLog({ ...baseInput, targetId: 'persist_me' });

    // appendAuditLog must not block on the DB write.
    expect(insertMock).not.toHaveBeenCalled();

    await flushSetImmediate();

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ id: entry.id, targetId: 'persist_me' }));
  });

  it('logs but does not throw when the database write fails', async () => {
    insertMock.mockRejectedValueOnce(new Error('db down'));

    expect(() => appendAuditLog({ ...baseInput, targetId: 'db_fail' })).not.toThrow();

    await flushSetImmediate();
    // allow the rejected promise's .catch handler to run
    await flushSetImmediate();

    expect(insertMock).toHaveBeenCalled();
  });

  it('queryAuditLog delegates to the database-backed repository', async () => {
    findManyMock.mockResolvedValueOnce({
      entries: [{ ...baseInput, id: 'audit_old', timestamp: new Date().toISOString() }],
      total: 1,
    });

    const result = await queryAuditLog({ actorId: 'user_1' });

    expect(findManyMock).toHaveBeenCalledWith({ actorId: 'user_1' });
    expect(result.total).toBe(1);
  });
});
