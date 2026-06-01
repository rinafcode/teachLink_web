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
