export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FraudCategory =
  | 'RAPID_JOIN_LEAVE'
  | 'MULTIPLE_CONNECTIONS'
  | 'SCREEN_SHARE_ABUSE'
  | 'UNAUTHORIZED_ACCESS'
  | 'ACTION_ABUSE'
  | 'SUSPICIOUS_IDENTITY'
  | 'MEETING_BOMBING';

export interface FraudEvent {
  id: string;
  timestamp: number;
  category: FraudCategory;
  severity: FraudSeverity;
  userId: string;
  roomId: string;
  details: Record<string, unknown>;
  blocked: boolean;
}

export interface FraudDetectionResult {
  isSuspicious: boolean;
  blocked: boolean;
  score: number;
  events: FraudEvent[];
  message?: string;
}

export interface UserActionContext {
  userId: string;
  userName: string;
  roomId: string;
  ipAddress?: string;
  timestamp: number;
}

export interface ConferenceAccessCheck {
  allowed: boolean;
  reason?: string;
  requiresVerification?: boolean;
}

export interface FraudDetectionConfig {
  maxJoinLeavePerMinute: number;
  maxScreenShareTogglesPerMinute: number;
  maxCallsPerMinute: number;
  maxConnectionsPerUser: number;
  enableStrictMode: boolean;
  blockOnCriticalThreats: boolean;
}

export const FRAUD_SEVERITIES: readonly FraudSeverity[] = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const FRAUD_CATEGORIES: readonly FraudCategory[] = [
  'RAPID_JOIN_LEAVE',
  'MULTIPLE_CONNECTIONS',
  'SCREEN_SHARE_ABUSE',
  'UNAUTHORIZED_ACCESS',
  'ACTION_ABUSE',
  'SUSPICIOUS_IDENTITY',
  'MEETING_BOMBING',
] as const;

export function isFraudSeverity(val: unknown): val is FraudSeverity {
  return typeof val === 'string' && (FRAUD_SEVERITIES as readonly string[]).includes(val);
}

export function isFraudCategory(val: unknown): val is FraudCategory {
  return typeof val === 'string' && (FRAUD_CATEGORIES as readonly string[]).includes(val);
}

export function isValidFraudEvent(event: unknown): event is FraudEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.timestamp === 'number' &&
    isFraudCategory(e.category) &&
    isFraudSeverity(e.severity) &&
    typeof e.userId === 'string' &&
    typeof e.roomId === 'string' &&
    typeof e.details === 'object' &&
    e.details !== null &&
    typeof e.blocked === 'boolean'
  );
}

export function isValidFraudDetectionResult(res: unknown): res is FraudDetectionResult {
  if (!res || typeof res !== 'object') return false;
  const r = res as Record<string, unknown>;
  return (
    typeof r.isSuspicious === 'boolean' &&
    typeof r.blocked === 'boolean' &&
    typeof r.score === 'number' &&
    Array.isArray(r.events) &&
    r.events.every(isValidFraudEvent) &&
    (r.message === undefined || typeof r.message === 'string')
  );
}

export function isValidUserActionContext(ctx: unknown): ctx is UserActionContext {
  if (!ctx || typeof ctx !== 'object') return false;
  const c = ctx as Record<string, unknown>;
  return (
    typeof c.userId === 'string' &&
    typeof c.userName === 'string' &&
    typeof c.roomId === 'string' &&
    typeof c.timestamp === 'number' &&
    (c.ipAddress === undefined || typeof c.ipAddress === 'string')
  );
}

export function isValidConferenceAccessCheck(check: unknown): check is ConferenceAccessCheck {
  if (!check || typeof check !== 'object') return false;
  const c = check as Record<string, unknown>;
  return (
    typeof c.allowed === 'boolean' &&
    (c.reason === undefined || typeof c.reason === 'string') &&
    (c.requiresVerification === undefined || typeof c.requiresVerification === 'boolean')
  );
}

export function isValidFraudDetectionConfig(config: unknown): config is FraudDetectionConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.maxJoinLeavePerMinute === 'number' &&
    typeof c.maxScreenShareTogglesPerMinute === 'number' &&
    typeof c.maxCallsPerMinute === 'number' &&
    typeof c.maxConnectionsPerUser === 'number' &&
    typeof c.enableStrictMode === 'boolean' &&
    typeof c.blockOnCriticalThreats === 'boolean'
  );
}

