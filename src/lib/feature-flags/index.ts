/**
 * src/lib/feature-flags — public barrel
 */
export type { FeatureFlag, TargetingRule, AuditEntry, RolloutStrategy } from './store';
export { flagStore, auditLog, evaluateFlag, createAuditEntry, generateId } from './store';
