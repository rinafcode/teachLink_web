/**
 * Database-backed feature flag operations.
 * Replaces the in-memory Map with PostgreSQL persistence.
 */

import { query } from '@/lib/db/pool';
import type { FeatureFlag, AuditEntry, TargetingRule } from './types';

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function generateId(prefix = 'flag'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Database Queries ─────────────────────────────────────────────────────────

/**
 * Get a single feature flag by ID
 */
export async function getFlagById(id: string): Promise<FeatureFlag | null> {
  const result = await query('SELECT * FROM feature_flags WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    strategy: row.strategy,
    percentage: row.percentage,
    rules: row.rules || [],
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * Get all feature flags, optionally sorted
 */
export async function getAllFlags(sortBy: 'updatedAt' | 'name' = 'updatedAt'): Promise<FeatureFlag[]> {
  const orderClause = sortBy === 'updatedAt' ? 'updated_at DESC' : 'name ASC';
  const result = await query(`SELECT * FROM feature_flags ORDER BY ${orderClause}`);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    strategy: row.strategy,
    percentage: row.percentage,
    rules: row.rules || [],
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  }));
}

/**
 * Create a new feature flag
 */
export async function createFlag(
  flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<FeatureFlag> {
  const id = generateId('flag');
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO feature_flags 
      (id, name, description, enabled, strategy, percentage, rules, tags, created_at, updated_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      id,
      flag.name,
      flag.description,
      flag.enabled,
      flag.strategy,
      flag.percentage,
      JSON.stringify(flag.rules),
      flag.tags,
      now,
      now,
      flag.createdBy,
    ],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    strategy: row.strategy,
    percentage: row.percentage,
    rules: row.rules || [],
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * Update an existing feature flag
 */
export async function updateFlag(
  id: string,
  updates: Partial<Omit<FeatureFlag, 'id' | 'createdAt' | 'createdBy'>>,
): Promise<FeatureFlag | null> {
  const existing = await getFlagById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  
  // Build update fields dynamically
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    values.push(updates.enabled);
  }
  if (updates.strategy !== undefined) {
    fields.push(`strategy = $${paramIndex++}`);
    values.push(updates.strategy);
  }
  if (updates.percentage !== undefined) {
    fields.push(`percentage = $${paramIndex++}`);
    values.push(updates.percentage);
  }
  if (updates.rules !== undefined) {
    fields.push(`rules = $${paramIndex++}`);
    values.push(JSON.stringify(updates.rules));
  }
  if (updates.tags !== undefined) {
    fields.push(`tags = $${paramIndex++}`);
    values.push(updates.tags);
  }

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(now);

  values.push(id);

  const result = await query(
    `UPDATE feature_flags SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    strategy: row.strategy,
    percentage: row.percentage,
    rules: row.rules || [],
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * Delete a feature flag
 */
export async function deleteFlag(id: string): Promise<boolean> {
  const result = await query('DELETE FROM feature_flags WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

// ─── Audit Log Functions ──────────────────────────────────────────────────────

/**
 * Create an audit entry for a feature flag change
 */
export async function createAuditEntry(
  action: AuditEntry['action'],
  actor: string,
  before: FeatureFlag | null,
  after: FeatureFlag | null,
): Promise<AuditEntry> {
  const id = generateId('audit');
  const flagId = (after ?? before)!.id;
  const flagName = (after ?? before)!.name;
  const timestamp = new Date().toISOString();

  await query(
    `INSERT INTO feature_flags_audit 
      (id, flag_id, flag_name, action, actor, before, after, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      flagId,
      flagName,
      action,
      actor,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      timestamp,
    ],
  );

  return {
    id,
    flagId,
    flagName,
    action,
    actor,
    before: before ? { ...before } : null,
    after: after ? { ...after } : null,
    timestamp,
  };
}

/**
 * Get audit log entries for a specific flag or all flags
 */
export async function getAuditLog(
  flagId?: string,
  limit: number = 500,
): Promise<AuditEntry[]> {
  const sql = flagId
    ? 'SELECT * FROM feature_flags_audit WHERE flag_id = $1 ORDER BY timestamp DESC LIMIT $2'
    : 'SELECT * FROM feature_flags_audit ORDER BY timestamp DESC LIMIT $1';
  
  const params = flagId ? [flagId, limit] : [limit];
  const result = await query(sql, params);

  return result.rows.map((row) => ({
    id: row.id,
    flagId: row.flag_id,
    flagName: row.flag_name,
    action: row.action,
    actor: row.actor,
    before: row.before || null,
    after: row.after || null,
    timestamp: row.timestamp,
  }));
}
