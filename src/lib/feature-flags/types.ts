/**
 * Feature Flag types.
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
