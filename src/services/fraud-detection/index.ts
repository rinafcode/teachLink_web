import type {
  FraudDetectionResult,
  FraudEvent,
  UserActionContext,
  ConferenceAccessCheck,
  FraudDetectionConfig,
  FraudCategory,
  FraudSeverity,
} from './types';

export type {
  FraudDetectionResult,
  FraudEvent,
  UserActionContext,
  ConferenceAccessCheck,
  FraudDetectionConfig,
  FraudCategory,
  FraudSeverity,
};

const DEFAULT_CONFIG: FraudDetectionConfig = {
  maxJoinLeavePerMinute: 5,
  maxScreenShareTogglesPerMinute: 4,
  maxCallsPerMinute: 3,
  maxConnectionsPerUser: 2,
  enableStrictMode: false,
  blockOnCriticalThreats: true,
};

interface ActionRecord {
  userId: string;
  action: string;
  roomId: string;
  timestamp: number;
}

interface ConnectionRecord {
  userId: string;
  roomId: string;
  joinedAt: number;
  active: boolean;
}

export class FraudDetectionService {
  private config: FraudDetectionConfig;
  private actionLog: ActionRecord[] = [];
  private connections: Map<string, ConnectionRecord[]> = new Map();
  private events: FraudEvent[] = [];
  private userScores: Map<string, number> = new Map();

  constructor(config?: Partial<FraudDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): FraudDetectionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<FraudDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private recordAction(action: string, context: UserActionContext): void {
    this.actionLog.push({
      userId: context.userId,
      action,
      roomId: context.roomId,
      timestamp: context.timestamp,
    });

    const cutoff = Date.now() - 60_000;
    while (this.actionLog.length > 0 && this.actionLog[0].timestamp < cutoff) {
      this.actionLog.shift();
    }
  }

  private addEvent(
    category: FraudCategory,
    severity: FraudSeverity,
    context: UserActionContext,
    details: Record<string, unknown>,
    blocked: boolean,
  ): FraudEvent {
    const event: FraudEvent = {
      id: `fraud-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      category,
      severity,
      userId: context.userId,
      roomId: context.roomId,
      details,
      blocked,
    };
    this.events.push(event);

    const scoreIncrement =
      severity === 'critical'
        ? 40
        : severity === 'high'
          ? 20
          : severity === 'medium'
            ? 10
            : 5;
    const currentScore = this.userScores.get(context.userId) ?? 0;
    this.userScores.set(context.userId, currentScore + scoreIncrement);

    return event;
  }

  getEvents(userId?: string): FraudEvent[] {
    if (userId) {
      return this.events.filter((e) => e.userId === userId);
    }
    return [...this.events];
  }

  getUserScore(userId: string): number {
    return this.userScores.get(userId) ?? 0;
  }

  resetUserScore(userId: string): void {
    this.userScores.delete(userId);
  }

  clearEvents(): void {
    this.events = [];
    this.userScores.clear();
    this.actionLog = [];
    this.connections.clear();
  }

  checkJoinMeeting(context: UserActionContext): FraudDetectionResult {
    const events: FraudEvent[] = [];
    let score = 0;
    let blocked = false;

    const recentJoins = this.actionLog.filter(
      (a) =>
        a.userId === context.userId &&
        a.action === 'join' &&
        a.timestamp > Date.now() - 60_000,
    );

    if (recentJoins.length >= this.config.maxJoinLeavePerMinute) {
      const event = this.addEvent(
        'RAPID_JOIN_LEAVE',
        'high',
        context,
        { recentJoins: recentJoins.length, action: 'join' },
        false,
      );
      events.push(event);
      score += 20;
    }

    const activeUserConnections = this.connections.get(context.userId) ?? [];
    const activeConnections = activeUserConnections.filter((c) => c.active);
    if (activeConnections.length >= this.config.maxConnectionsPerUser) {
      const event = this.addEvent(
        'MULTIPLE_CONNECTIONS',
        'high',
        context,
        { activeConnections: activeConnections.length },
        this.config.blockOnCriticalThreats,
      );
      events.push(event);
      score += 20;
      if (this.config.blockOnCriticalThreats) {
        blocked = true;
      }
    }

    const connection: ConnectionRecord = {
      userId: context.userId,
      roomId: context.roomId,
      joinedAt: context.timestamp,
      active: true,
    };
    const existing = this.connections.get(context.userId) ?? [];
    existing.push(connection);
    this.connections.set(context.userId, existing);

    this.recordAction('join', context);

    return {
      isSuspicious: events.length > 0,
      blocked,
      score,
      events,
    };
  }

  checkLeaveMeeting(context: UserActionContext): FraudDetectionResult {
    const events: FraudEvent[] = [];
    let score = 0;

    const connections = this.connections.get(context.userId) ?? [];
    const activeConnection = connections.find(
      (c) => c.roomId === context.roomId && c.active,
    );
    if (activeConnection) {
      activeConnection.active = false;
    }

    const recentLeaves = this.actionLog.filter(
      (a) =>
        a.userId === context.userId &&
        a.action === 'leave' &&
        a.timestamp > Date.now() - 60_000,
    );

    if (recentLeaves.length >= this.config.maxJoinLeavePerMinute) {
      const event = this.addEvent(
        'RAPID_JOIN_LEAVE',
        'high',
        context,
        { recentLeaves: recentLeaves.length, action: 'leave' },
        false,
      );
      events.push(event);
      score += 20;
    }

    this.recordAction('leave', context);

    return {
      isSuspicious: events.length > 0,
      blocked: false,
      score,
      events,
    };
  }

  checkScreenShare(
    context: UserActionContext,
    enabled: boolean,
  ): FraudDetectionResult {
    const events: FraudEvent[] = [];
    let score = 0;

    const recentToggles = this.actionLog.filter(
      (a) =>
        a.userId === context.userId &&
        a.action === 'screen-share' &&
        a.timestamp > Date.now() - 60_000,
    );

    if (recentToggles.length >= this.config.maxScreenShareTogglesPerMinute) {
      const event = this.addEvent(
        'SCREEN_SHARE_ABUSE',
        'medium',
        context,
        { recentToggles: recentToggles.length, enabled },
        false,
      );
      events.push(event);
      score += 10;
    }

    this.recordAction('screen-share', context);

    return {
      isSuspicious: events.length > 0,
      blocked: false,
      score,
      events,
    };
  }

  checkStartCall(context: UserActionContext): FraudDetectionResult {
    const events: FraudEvent[] = [];
    let score = 0;
    let blocked = false;

    const recentCalls = this.actionLog.filter(
      (a) =>
        a.userId === context.userId &&
        a.action === 'start-call' &&
        a.timestamp > Date.now() - 60_000,
    );

    if (recentCalls.length >= this.config.maxCallsPerMinute) {
      const event = this.addEvent(
        'ACTION_ABUSE',
        'medium',
        context,
        { recentCalls: recentCalls.length, action: 'start-call' },
        false,
      );
      events.push(event);
      score += 10;
    }

    const userScore = this.userScores.get(context.userId) ?? 0;
    if (userScore >= 50) {
      const event = this.addEvent(
        'SUSPICIOUS_IDENTITY',
        'critical',
        context,
        { totalScore: userScore },
        this.config.blockOnCriticalThreats,
      );
      events.push(event);
      score += 40;
      if (this.config.blockOnCriticalThreats) {
        blocked = true;
      }
    }

    this.recordAction('start-call', context);

    return {
      isSuspicious: events.length > 0,
      blocked,
      score,
      events,
    };
  }

  checkConferenceAccess(
    userId: string,
    roomId: string,
    isHost: boolean,
    hostUserId?: string,
  ): ConferenceAccessCheck {
    if (isHost) {
      return { allowed: true };
    }

    if (hostUserId && this.userScores.get(hostUserId) != null) {
      const hostScore = this.userScores.get(hostUserId) ?? 0;
      if (hostScore >= 50) {
        return {
          allowed: false,
          reason: 'Host account flagged for suspicious activity',
          requiresVerification: true,
        };
      }
    }

    const userScore = this.userScores.get(userId) ?? 0;
    if (userScore >= 80) {
      return {
        allowed: false,
        reason:
          'Account temporarily restricted due to suspicious activity',
        requiresVerification: true,
      };
    }

    if (this.config.enableStrictMode && userScore >= 30) {
      return {
        allowed: true,
        reason: 'Access granted with monitoring',
        requiresVerification: true,
      };
    }

    return { allowed: true };
  }

  checkMeetingBombing(context: UserActionContext): FraudDetectionResult {
    const events: FraudEvent[] = [];
    let score = 0;
    let blocked = false;

    const recentJoinsFromIp = this.actionLog.filter(
      (a) =>
        a.action === 'join' &&
        a.roomId === context.roomId &&
        a.timestamp > Date.now() - 10_000,
    );

    if (recentJoinsFromIp.length >= 3) {
      const event = this.addEvent(
        'MEETING_BOMBING',
        'critical',
        context,
        { rapidJoinsFromDifferentUsers: recentJoinsFromIp.length },
        true,
      );
      events.push(event);
      score += 40;
      blocked = true;
    }

    return {
      isSuspicious: events.length > 0,
      blocked,
      score,
      events,
    };
  }
}

export const fraudDetectionService = new FraudDetectionService();
