import { query } from '../pool';
import type { AuditAction, AuditLogEntry, AuditQuery } from '@/lib/audit/types';

/**
 * Audit Log Repository
 * Handles durable persistence of audit trail entries in PostgreSQL.
 *
 * The in-memory audit store (src/lib/audit/store.ts) only keeps a small
 * recent-entries buffer for fast reads; this repository is the durable,
 * queryable source of truth used for admin/compliance queries.
 */

export async function insert(entry: AuditLogEntry): Promise<void> {
  await query(
    `INSERT INTO audit_log
       (id, actor_id, action, target_type, target_id, path, method, ip, user_agent, status_code, metadata, "timestamp")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO NOTHING`,
    [
      entry.id,
      entry.actorId,
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.path,
      entry.method,
      entry.ip,
      entry.userAgent,
      entry.statusCode,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.timestamp,
    ]
  );
}

interface AuditLogRow {
  id: string;
  actor_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  path: string;
  method: string;
  ip: string;
  user_agent: string;
  status_code: number;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    path: row.path,
    method: row.method,
    ip: row.ip,
    userAgent: row.user_agent,
    statusCode: row.status_code,
    metadata: row.metadata ?? undefined,
    timestamp: row.timestamp.toISOString(),
  };
}

export async function findMany(
  filters: AuditQuery = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.action) {
    params.push(filters.action);
    conditions.push(`action = $${params.length}`);
  }

  if (filters.actorId) {
    params.push(filters.actorId);
    conditions.push(`actor_id = $${params.length}`);
  }

  if (filters.targetType) {
    params.push(filters.targetType);
    conditions.push(`target_type = $${params.length}`);
  }

  const search = filters.search?.toLowerCase().trim();
  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(LOWER(actor_id) LIKE $${idx} OR LOWER(target_type) LIKE $${idx} OR LOWER(target_id) LIKE $${idx} OR LOWER(path) LIKE $${idx} OR LOWER(COALESCE(metadata::text, '')) LIKE $${idx})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
  const offset = Math.max(0, filters.offset ?? 0);

  const countResult = await query(
    `SELECT COUNT(*)::int AS count FROM audit_log ${whereClause}`,
    params
  );
  const total = (countResult.rows[0] as { count: number } | undefined)?.count ?? 0;

  const dataParams = [...params, limit, offset];
  const result = await query(
    `SELECT id, actor_id, action, target_type, target_id, path, method, ip, user_agent, status_code, metadata, "timestamp"
     FROM audit_log
     ${whereClause}
     ORDER BY "timestamp" DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    entries: (result.rows as AuditLogRow[]).map(toAuditLogEntry),
    total,
  };
}
