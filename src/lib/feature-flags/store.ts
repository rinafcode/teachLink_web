/**
 * Feature Flag evaluation and utilities.
 * 
 * Database persistence: All feature flags are now stored in PostgreSQL.
 * See ./db.ts for CRUD operations.
 */

import type { FeatureFlag, AuditEntry, TargetingRule, RolloutStrategy } from './types';

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

// ─── In-process stores ────────────────────────────────────────────────────────

export const flagStore = new Map<string, FeatureFlag>();
export const auditLog: AuditEntry[] = [];

// ─── Seed with sensible defaults ──────────────────────────────────────────────

const now = new Date().toISOString();

const SEED_FLAGS: FeatureFlag[] = [
  {
    id: 'flag_new_dashboard',
    name: 'New Dashboard',
    description: 'Enables the redesigned learner dashboard.',
    enabled: false,
    strategy: 'percentage',
    percentage: 10,
    rules: [],
    tags: ['ui', 'dashboard'],
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
  },
  {
    id: 'flag_ai_tutor',
    name: 'AI Tutor',
    description: 'Activates the AI-powered tutoring assistant.',
    enabled: false,
    strategy: 'targeting',
    percentage: 0,
    rules: [{ attribute: 'plan', operator: 'equals', value: 'pro' }],
    tags: ['ai', 'beta'],
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
  },
  {
    id: 'flag_video_speed',
    name: 'Video Speed Controls',
    description: 'Shows advanced playback speed options (0.5×–3×) in the video player.',
    enabled: true,
    strategy: 'all',
    percentage: 100,
    rules: [],
    tags: ['video', 'ux'],
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
  },
];

for (const f of SEED_FLAGS) {
  flagStore.set(f.id, f);
}

// ─── Evaluation Logic ─────────────────────────────────────────────────────────

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
