import { createLogger } from '@/lib/logging';
import * as auditLogRepository from '@/lib/db/repositories/audit-log.repository';
import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from './types';

const logger = createLogger('audit-store');

// Durability: every entry is written to the `audit_log` table asynchronously
// (see persistToDatabase below). This in-memory array is now only a small
// recent-entries cache for fast, synchronous reads (e.g. UI optimistic
// updates) — it is NOT the durable store and must stay small.
const IN_MEMORY_BUFFER_CAP = 50;
const auditStore: AuditLogEntry[] = [];

function generateId(prefix = 'audit'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Fire-and-forget persistence of a single audit entry to the database.
 * Scheduled via setImmediate so it never blocks the caller (the audit log
 * must not add latency to the request that triggered it), with any failure
 * logged rather than thrown — losing the durable write should not crash the
 * request, but it must be observable.
 *
 * There's no job queue library in this codebase (checked package.json), so
 * this minimal fire-and-forget approach is intentional per the issue's
 * guidance rather than a rejection of a queue that already existed.
 */
function persistToDatabase(entry: AuditLogEntry): void {
  setImmediate(() => {
    auditLogRepository.insert(entry).catch((error) => {
      logger.error('[Audit] Failed to persist audit log entry to database', {
        error: error instanceof Error ? error : new Error(String(error)),
        context: { auditId: entry.id, targetType: entry.targetType, targetId: entry.targetId },
      });
    });
  });
}

export function appendAuditLog(input: CreateAuditLogInput): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    path: input.path,
    method: input.method.toUpperCase(),
    ip: input.ip,
    userAgent: input.userAgent,
    statusCode: input.statusCode,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
  };

  auditStore.unshift(entry);
  if (auditStore.length > IN_MEMORY_BUFFER_CAP) {
    auditStore.length = IN_MEMORY_BUFFER_CAP;
  }

  persistToDatabase(entry);

  return entry;
}

/**
 * Synchronous, in-memory-only lookup over the small recent-entries buffer.
 * Fast, but only ever sees the last IN_MEMORY_BUFFER_CAP entries — use
 * queryAuditLog() (database-backed) for admin/compliance queries that need
 * to see records older than the buffer.
 */
export function queryAuditLogs(query: AuditQuery = {}): {
  entries: AuditLogEntry[];
  total: number;
} {
  const search = query.search?.toLowerCase().trim() ?? '';
  const filtered = auditStore.filter((entry) => {
    if (query.action && entry.action !== query.action) return false;
    if (query.actorId && entry.actorId !== query.actorId) return false;
    if (query.targetType && entry.targetType !== query.targetType) return false;

    if (search) {
      const haystack = [
        entry.actorId,
        entry.targetType,
        entry.targetId,
        entry.path,
        JSON.stringify(entry.metadata ?? {}),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  const limit = Math.min(200, Math.max(1, query.limit ?? 50));
  const offset = Math.max(0, query.offset ?? 0);

  return {
    entries: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export function getAuditStoreSnapshot(): AuditLogEntry[] {
  return [...auditStore];
}

/**
 * Database-backed audit query for admin/compliance use. Unlike
 * queryAuditLogs(), this reads from the durable `audit_log` table, so it
 * can return entries beyond the small in-memory buffer (i.e. anything ever
 * written, not just the most recent IN_MEMORY_BUFFER_CAP entries).
 */
export async function queryAuditLog(
  query: AuditQuery = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  return auditLogRepository.findMany(query);
}
