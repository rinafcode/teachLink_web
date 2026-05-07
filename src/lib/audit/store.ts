import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from './types';

const AUDIT_CAP = 5000;
const auditStore: AuditLogEntry[] = [];

function generateId(prefix = 'audit'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
  if (auditStore.length > AUDIT_CAP) {
    auditStore.length = AUDIT_CAP;
  }

  return entry;
}

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
