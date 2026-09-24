import { createLogger } from '@/lib/logging';
import * as auditLogRepository from '@/lib/db/repositories/audit-log.repository';
import { appendAuditLog as appendToMemory } from './store';
import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from './types';

// Node.js-only: this module imports the `pg`-backed repository, so it must
// never be imported from an Edge-reachable path (see ./store.ts's header
// comment). It's the barrel (./index.ts) that wires this in for regular
// (non-Edge) callers; src/middleware/audit.ts imports ./store directly to
// stay Edge-safe and deliberately does not get durable persistence.

const logger = createLogger('audit-persist');

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

/**
 * Durable append: records the entry in the in-memory recent-entries buffer
 * (via ./store.ts) and asynchronously persists it to the `audit_log` table.
 * This is the version every regular (Node.js runtime) caller should use —
 * it's what ./index.ts exports as `appendAuditLog`.
 */
export function appendAuditLog(input: CreateAuditLogInput): AuditLogEntry {
  const entry = appendToMemory(input);
  persistToDatabase(entry);
  return entry;
}

/**
 * Database-backed audit query for admin/compliance use. Unlike
 * queryAuditLogs() (in ./store.ts), this reads from the durable
 * `audit_log` table, so it can return entries beyond the small in-memory
 * buffer (i.e. anything ever written, not just the most recent
 * IN_MEMORY_BUFFER_CAP entries).
 */
export async function queryAuditLog(
  query: AuditQuery = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  return auditLogRepository.findMany(query);
}
