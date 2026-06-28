/**
 * Feature Flag evaluation and utilities.
 * 
 * Database persistence: All feature flags are now stored in PostgreSQL.
 * See ./db.ts for CRUD operations.
 */

// Re-export types and database functions
export type { FeatureFlag, AuditEntry, TargetingRule, RolloutStrategy } from './types';
export {
  getFlagById,
  getAllFlags,
  createFlag,
  updateFlag,
  deleteFlag,
  createAuditEntry,
  getAuditLog,
  generateId,
} from './db';

// ─── Evaluation Logic ─────────────────────────────────────────────────────────

import type { FeatureFlag } from './types';

/**
 * Evaluate whether a flag is active for a given user context.
 * Context is a flat key→value map (e.g. { userId, plan, country }).
 */
export function evaluateFlag(flag: FeatureFlag, context: Record<string, string> = {}): boolean {
  if (!flag.enabled) return false;

  switch (flag.strategy) {
    case 'all':
      return true;

    case 'percentage': {
      if (flag.percentage >= 100) return true;
      if (flag.percentage <= 0) return false;
      // Deterministic per-user bucket via userId hash
      const userId = context.userId ?? '';
      let hash = 0;
      for (let i = 0; i < (flag.id + userId).length; i++) {
        hash = Math.imul(31, hash) + (flag.id + userId).charCodeAt(i);
        hash |= 0;
      }
      const bucket = Math.abs(hash) % 100;
      return bucket < flag.percentage;
    }

    case 'targeting': {
      if (flag.rules.length === 0) return false;
      // ALL rules must match (AND logic)
      return flag.rules.every((rule) => {
        const attrVal = context[rule.attribute] ?? '';
        switch (rule.operator) {
          case 'equals':
            return attrVal === rule.value;
          case 'contains':
            return attrVal.includes(rule.value);
          case 'startsWith':
            return attrVal.startsWith(rule.value);
          case 'in':
            return rule.value
              .split(',')
              .map((v) => v.trim())
              .includes(attrVal);
          default:
            return false;
        }
      });
    }

    default:
      return false;
  }
}
