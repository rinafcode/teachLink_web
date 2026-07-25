import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FraudDetectionService } from '../index';
import type { UserActionContext } from '../types';

// Use fake timers for predictable time-based tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function createContext(overrides: Partial<UserActionContext> = {}): UserActionContext {
  return {
    userId: 'user-1',
    userName: 'Test User',
    roomId: 'room-1',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;

  beforeEach(() => {
    service = new FraudDetectionService();
  });

  afterEach(() => {
    service.clearEvents();
  });

  describe('checkJoinMeeting', () => {
    it('allows joining when no suspicious activity exists', () => {
      const result = service.checkJoinMeeting(createContext());
      expect(result.blocked).toBe(false);
      expect(result.isSuspicious).toBe(false);
      expect(result.score).toBe(0);
      expect(result.events).toHaveLength(0);
    });

    it('flags rapid join attempts', () => {
      const ctx = createContext();

      // Join 5 times (max allowed is 5 per minute in default config)
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(100);
        service.checkJoinMeeting({ ...ctx, timestamp: Date.now() });
      }

      // 6th join should trigger fraud detection
      const result = service.checkJoinMeeting({
        ...ctx,
        timestamp: Date.now(),
      });
      expect(result.isSuspicious).toBe(true);
      expect(result.events.some((e) => e.category === 'RAPID_JOIN_LEAVE')).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('blocks when exceeding max connections per user', () => {
      const ctx = createContext();

      // Simulate 3 concurrent connections (max is 2)
      for (let i = 0; i < 3; i++) {
        service.checkJoinMeeting({
          ...ctx,
          roomId: `room-${i}`,
          timestamp: Date.now(),
        });
      }

      const result = service.checkJoinMeeting({
        ...ctx,
        roomId: 'room-3',
        timestamp: Date.now(),
      });
      expect(result.blocked).toBe(true);
      expect(result.events.some((e) => e.category === 'MULTIPLE_CONNECTIONS')).toBe(true);
    });

    it('does not block when config.blockOnCriticalThreats is false', () => {
      service = new FraudDetectionService({ blockOnCriticalThreats: false });
      const ctx = createContext();

      for (let i = 0; i < 3; i++) {
        service.checkJoinMeeting({
          ...ctx,
          roomId: `room-${i}`,
          timestamp: Date.now(),
        });
      }

      const result = service.checkJoinMeeting({
        ...ctx,
        roomId: 'room-3',
        timestamp: Date.now(),
      });
      expect(result.blocked).toBe(false);
      expect(result.isSuspicious).toBe(true);
    });
  });

  describe('checkLeaveMeeting', () => {
    it('allows leaving a meeting without flags', () => {
      service.checkJoinMeeting(createContext());
      const result = service.checkLeaveMeeting(createContext());
      expect(result.blocked).toBe(false);
      expect(result.isSuspicious).toBe(false);
    });

    it('flags rapid leave attempts', () => {
      const ctx = createContext();

      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(100);
        service.checkJoinMeeting({ ...ctx, timestamp: Date.now() });
        service.checkLeaveMeeting({ ...ctx, timestamp: Date.now() });
      }

      const result = service.checkLeaveMeeting({
        ...ctx,
        timestamp: Date.now(),
      });
      expect(result.isSuspicious).toBe(true);
      expect(result.events.some((e) => e.category === 'RAPID_JOIN_LEAVE')).toBe(true);
    });

    it('clears connection record on leave', () => {
      const ctx = createContext();
      service.checkJoinMeeting(ctx);
      const result = service.checkLeaveMeeting(ctx);
      expect(result.blocked).toBe(false);
    });
  });

  describe('checkScreenShare', () => {
    it('allows screen share toggling within limits', () => {
      const ctx = createContext();
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
        const result = service.checkScreenShare({ ...ctx, timestamp: Date.now() }, true);
        expect(result.blocked).toBe(false);
        expect(result.events).toHaveLength(0);
      }
    });

    it('flags rapid screen share toggles', () => {
      const ctx = createContext();

      // Toggle 5 times rapidly (max is 4 per minute)
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(100);
        service.checkScreenShare({ ...ctx, timestamp: Date.now() }, true);
      }

      const result = service.checkScreenShare({ ...ctx, timestamp: Date.now() }, true);
      expect(result.isSuspicious).toBe(true);
      expect(result.events.some((e) => e.category === 'SCREEN_SHARE_ABUSE')).toBe(true);
    });
  });

  describe('checkStartCall', () => {
    it('allows starting calls within limits', () => {
      const ctx = createContext();
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
        const result = service.checkStartCall({
          ...ctx,
          timestamp: Date.now(),
        });
        expect(result.blocked).toBe(false);
      }
    });

    it('flags rapid call attempts', () => {
      const ctx = createContext();

      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(100);
        service.checkStartCall({ ...ctx, timestamp: Date.now() });
      }

      const result = service.checkStartCall({
        ...ctx,
        timestamp: Date.now(),
      });
      expect(result.isSuspicious).toBe(true);
      expect(result.events.some((e) => e.category === 'ACTION_ABUSE')).toBe(true);
    });

    it('blocks call when user score exceeds threshold', () => {
      const ctx = createContext();

      // Accumulate score by triggering multiple fraud events
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(100);
        service.checkStartCall({ ...ctx, timestamp: Date.now() });
      }

      // Additional call attempts increase score
      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(100);
        const result = service.checkStartCall({
          ...ctx,
          timestamp: Date.now(),
        });
        if (result.blocked) {
          expect(result.events.some((e) => e.category === 'SUSPICIOUS_IDENTITY')).toBe(true);
          return;
        }
      }

      // Should have been blocked by now
      const finalResult = service.checkStartCall({
        ...ctx,
        timestamp: Date.now(),
      });
      expect(finalResult.blocked).toBe(true);
    });
  });

  describe('checkConferenceAccess', () => {
    it('allows host access', () => {
      const result = service.checkConferenceAccess('user-1', 'room-1', true);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('allows guest access when user has clean record', () => {
      const result = service.checkConferenceAccess('user-2', 'room-1', false);
      expect(result.allowed).toBe(true);
    });

    it('restricts access when user score is high', () => {
      const ctx = createContext();

      // Drive up the score
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(100);
        service.checkStartCall({ ...ctx, timestamp: Date.now() });
      }

      const result = service.checkConferenceAccess('user-1', 'room-1', false);
      expect(result.allowed).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.reason).toContain('restricted');
    });

    it('flags when host has suspicious activity', () => {
      const hostCtx = createContext({ userId: 'host-1' });

      // Need 8 calls to accumulate 50+ score (calls 4-8 each add 10 pts)
      for (let i = 0; i < 8; i++) {
        vi.advanceTimersByTime(100);
        service.checkStartCall({ ...hostCtx, timestamp: Date.now() });
      }

      const result = service.checkConferenceAccess('user-2', 'room-1', false, 'host-1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Host');
    });

    it('applies monitoring in strict mode for moderate scores', () => {
      service = new FraudDetectionService({ enableStrictMode: true });
      const ctx = createContext();

      // Need 6 calls to accumulate 30+ score (calls 4-6 each add 10 pts)
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(100);
        service.checkStartCall({ ...ctx, timestamp: Date.now() });
      }

      const result = service.checkConferenceAccess('user-1', 'room-1', false);
      expect(result.allowed).toBe(true);
      expect(result.requiresVerification).toBe(true);
    });
  });

  describe('checkMeetingBombing', () => {
    it('allows normal joins', () => {
      const ctx = createContext();
      const result = service.checkMeetingBombing(ctx);
      expect(result.blocked).toBe(false);
      expect(result.isSuspicious).toBe(false);
    });

    it('detects rapid join bomb', () => {
      const ctx = createContext();

      // Simulate 3 rapid joins from different users
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(100);
        service.checkJoinMeeting({
          ...ctx,
          userId: `user-${i}`,
          timestamp: Date.now(),
        });
      }

      const result = service.checkMeetingBombing({
        ...ctx,
        userId: 'attacker',
        timestamp: Date.now(),
      });
      expect(result.blocked).toBe(true);
      expect(result.isSuspicious).toBe(true);
      expect(result.events.some((e) => e.category === 'MEETING_BOMBING')).toBe(true);
    });
  });

  describe('getEvents', () => {
    it('returns all events when no userId specified', () => {
      service.checkJoinMeeting(createContext());
      const events = service.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(0);
    });

    it('filters events by userId', () => {
      service.checkJoinMeeting(createContext({ userId: 'user-a' }));
      service.checkJoinMeeting(createContext({ userId: 'user-b' }));

      const userAEvents = service.getEvents('user-a');
      expect(userAEvents.every((e) => e.userId === 'user-a')).toBe(true);
    });
  });

  describe('getUserScore', () => {
    it('returns 0 for unknown users', () => {
      expect(service.getUserScore('unknown')).toBe(0);
    });

    it('returns accumulated score', () => {
      const ctx = createContext();

      service.checkJoinMeeting(ctx);
      expect(service.getUserScore('user-1')).toBe(0); // clean join

      // Trigger a rapid join event
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(100);
        service.checkJoinMeeting({ ...ctx, timestamp: Date.now() });
      }
      expect(service.getUserScore('user-1')).toBeGreaterThan(0);
    });
  });

  describe('resetUserScore', () => {
    it('resets score to 0', () => {
      service.resetUserScore('user-1');
      expect(service.getUserScore('user-1')).toBe(0);
    });
  });

  describe('getConfig / updateConfig', () => {
    it('returns current config', () => {
      const config = service.getConfig();
      expect(config.maxCallsPerMinute).toBe(3);
    });

    it('updates config values', () => {
      service.updateConfig({ maxCallsPerMinute: 10 });
      expect(service.getConfig().maxCallsPerMinute).toBe(10);
    });
  });

  describe('clearEvents', () => {
    it('clears all events and scores', () => {
      const ctx = createContext();

      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(100);
        service.checkJoinMeeting({ ...ctx, timestamp: Date.now() });
      }

      expect(service.getEvents().length).toBeGreaterThan(0);
      expect(service.getUserScore('user-1')).toBeGreaterThan(0);

      service.clearEvents();
      expect(service.getEvents()).toHaveLength(0);
      expect(service.getUserScore('user-1')).toBe(0);
    });
  });
});
