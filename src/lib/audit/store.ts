import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from './types';

// This module must stay Edge-Runtime-safe: it's reachable from Edge routes
// (e.g. src/app/api/admin/feature-flags/route.ts, via src/middleware/audit.ts),
// and the Edge Runtime doesn't provide Node.js core modules (`fs`, `net`,
// `tls`) that a database driver needs. Durable persistence therefore lives
// in a separate, Node-only module (./persist.ts) that wraps appendAuditLog
// below — never import a database/repository module from this file.
const IN_MEMORY_BUFFER_CAP = 50;
const auditStore: AuditLogEntry[] = [];

function generateId(prefix = 'audit'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Records an entry in the small in-memory recent-entries buffer. This is
 * NOT durable storage on its own — see ./persist.ts's appendAuditLog, which
 * wraps this with an async database write for every non-Edge caller.
 */
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
    traceId: input.traceId,
    metadata: input.metadata,
  };

  auditStore.unshift(entry);
  if (auditStore.length > IN_MEMORY_BUFFER_CAP) {
    auditStore.length = IN_MEMORY_BUFFER_CAP;
  }

  return entry;
}

/**
 * Synchronous, in-memory-only lookup over the small recent-entries buffer.
 * Fast, but only ever sees the last IN_MEMORY_BUFFER_CAP entries — use
 * queryAuditLog() (database-backed, in ./persist.ts) for admin/compliance
 * queries that need to see records older than the buffer.
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
