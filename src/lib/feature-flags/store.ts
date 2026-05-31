/**
 * Feature Flag types and in-process store.
 *
 * Persistence: flags are kept in a module-level Map so they survive
 * across API requests within the same Node.js process (dev / single
 * instance prod). Replace `flagStore` / `auditStore` with a database
 * client for multi-instance deployments.
 */

// ─── Core types ───────────────────────────────────────────────────────────────

export type RolloutStrategy = 'all' | 'percentage' | 'targeting';

export interface TargetingRule {
  /** e.g. "userId", "email", "country", "plan" */
  attribute: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'in';
  /** string or comma-separated list for 'in' */
  value: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  strategy: RolloutStrategy;
  /** 0–100, used when strategy === 'percentage' */
  percentage: number;
  /** used when strategy === 'targeting' */
  rules: TargetingRule[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditEntry {
  id: string;
  flagId: string;
  flagName: string;
  action: 'created' | 'updated' | 'deleted' | 'toggled';
  actor: string;
  before: Partial<FeatureFlag> | null;
  after: Partial<FeatureFlag> | null;
  timestamp: string;
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(prefix = 'flag'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createAuditEntry(
  action: AuditEntry['action'],
  actor: string,
  before: FeatureFlag | null,
  after: FeatureFlag | null,
): AuditEntry {
  const entry: AuditEntry = {
    id: generateId('audit'),
    flagId: (after ?? before)!.id,
    flagName: (after ?? before)!.name,
    action,
    actor,
    before: before ? { ...before } : null,
    after: after ? { ...after } : null,
    timestamp: new Date().toISOString(),
  };
  // Keep last 500 audit entries
  auditLog.unshift(entry);
  if (auditLog.length > 500) auditLog.length = 500;
  return entry;
}

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
