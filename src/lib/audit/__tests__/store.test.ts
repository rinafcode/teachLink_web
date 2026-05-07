import { describe, expect, it, vi } from 'vitest';
import { appendAuditLog, queryAuditLogs, getAuditStoreSnapshot } from '../store';

vi.mock('@/lib/audit', () => ({
  appendAuditLog,
  queryAuditLogs,
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

describe('audit store', () => {
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
});
