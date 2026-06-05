/**
 * Recommendation Engine — unit tests
 *
 * Pure function tests: no DOM, no mocks, no async.
 */
import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '../recommendation-engine';
import {
  NotificationAnalytics,
  NotificationCategory,
  NotificationChannel,
  UserNotificationPreferences,
} from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeAnalytics(
  overrides: Partial<{
    totalSent: number;
    totalRead: number;
    totalClicked: number;
    byChannel: Partial<NotificationAnalytics['byChannel']>;
    byCategory: Partial<NotificationAnalytics['byCategory']>;
  }> = {},
): NotificationAnalytics {
  const defaultChannel = { sent: 0, read: 0, clicked: 0 };
  const defaultCategory = { sent: 0, read: 0, clicked: 0 };

  return {
    totalSent: overrides.totalSent ?? 0,
    totalRead: overrides.totalRead ?? 0,
    totalClicked: overrides.totalClicked ?? 0,
    readRate: overrides.totalSent ? ((overrides.totalRead ?? 0) / overrides.totalSent) * 100 : 0,
    clickRate: overrides.totalSent
      ? ((overrides.totalClicked ?? 0) / overrides.totalSent) * 100
      : 0,
    byChannel: {
      push: defaultChannel,
      email: defaultChannel,
      sms: defaultChannel,
      'in-app': defaultChannel,
      ...overrides.byChannel,
    },
    byCategory: {
      course_update: defaultCategory,
      message: defaultCategory,
      achievement: defaultCategory,
      reminder: defaultCategory,
      system: defaultCategory,
      social: defaultCategory,
      payment: defaultCategory,
      ...overrides.byCategory,
    },
  };
}

function makePreferences(
  overrides: Partial<UserNotificationPreferences> = {},
): UserNotificationPreferences {
  return {
    userId: 'test-user',
    channels: {
      push: true,
      email: true,
      sms: false,
      inApp: true,
    },
    categories: {
      course_update: { enabled: true, channels: ['in-app', 'email'] },
      message: { enabled: true, channels: ['in-app', 'push'] },
      achievement: { enabled: true, channels: ['in-app', 'push', 'email'] },
      reminder: { enabled: true, channels: ['in-app', 'push'] },
      system: { enabled: true, channels: ['in-app'] },
      social: { enabled: true, channels: ['in-app'] },
      payment: { enabled: true, channels: ['in-app', 'email'] },
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
    frequency: {
      digest: 'realtime',
      maxPerDay: 50,
    },
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('generateRecommendations', () => {
  // ── Empty data ──────────────────────────────────────────────────────────────

  describe('empty analytics', () => {
    it('returns an empty array when totalSent is 0', () => {
      const result = generateRecommendations(makeAnalytics(), makePreferences());
      expect(result).toEqual([]);
    });
  });

  // ── Rule 1: disable_category ────────────────────────────────────────────────

  describe('Rule 1 — disable_category', () => {
    it('recommends disabling a category with read-rate < 20 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 1,
        byCategory: {
          system: { sent: 10, read: 1, clicked: 0 }, // 10 % read-rate
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'disable_category' && r.category === 'system');
      expect(rec).toBeDefined();
      expect(rec!.preferencePatch.categories!.system.enabled).toBe(false);
    });

    it('does NOT recommend disabling a category with fewer than 5 sent', () => {
      const analytics = makeAnalytics({
        totalSent: 3,
        totalRead: 0,
        byCategory: {
          system: { sent: 3, read: 0, clicked: 0 },
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'disable_category');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend disabling an already-disabled category', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 0,
        byCategory: {
          system: { sent: 10, read: 0, clicked: 0 },
        },
      });

      const prefs = makePreferences({
        categories: {
          ...makePreferences().categories,
          system: { enabled: false, channels: ['in-app'] },
        },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'disable_category' && r.category === 'system');
      expect(rec).toBeUndefined();
    });

    it('assigns high impact when read-rate < 10 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 0,
        byCategory: {
          system: { sent: 10, read: 0, clicked: 0 }, // 0 % read-rate
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'disable_category');
      expect(rec!.impact).toBe('high');
    });
  });

  // ── Rule 2: add_channel ─────────────────────────────────────────────────────

  describe('Rule 2 — add_channel (push)', () => {
    it('recommends adding push when click-rate > 60 % and push not in category channels', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 5,
        totalClicked: 7,
        byCategory: {
          system: { sent: 10, read: 5, clicked: 7 }, // 70 % click-rate
        },
      });

      // system category doesn't have push
      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'add_channel' && r.category === 'system');
      expect(rec).toBeDefined();
      expect(rec!.channel).toBe('push');
      expect(rec!.preferencePatch.categories!.system.channels).toContain('push');
    });

    it('does NOT recommend push when it is already in the category channels', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 5,
        totalClicked: 7,
        byCategory: {
          message: { sent: 10, read: 5, clicked: 7 }, // message already has push
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'add_channel' && r.category === 'message');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend push when push is globally disabled', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 5,
        totalClicked: 7,
        byCategory: {
          system: { sent: 10, read: 5, clicked: 7 },
        },
      });

      const prefs = makePreferences({
        channels: { push: false, email: true, sms: false, inApp: true },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'add_channel');
      expect(rec).toBeUndefined();
    });
  });

  // ── Rule 3: switch_digest ───────────────────────────────────────────────────

  describe('Rule 3 — switch_digest', () => {
    it('recommends daily digest when email read-rate < 10 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 0,
        byChannel: {
          email: { sent: 10, read: 0, clicked: 0 }, // 0 % read-rate
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'switch_digest');
      expect(rec).toBeDefined();
      expect(rec!.preferencePatch.frequency!.digest).toBe('daily');
    });

    it('does NOT recommend digest when already on a digest mode', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 0,
        byChannel: {
          email: { sent: 10, read: 0, clicked: 0 },
        },
      });

      const prefs = makePreferences({
        frequency: { digest: 'daily', maxPerDay: 50 },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'switch_digest');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend digest when email is globally disabled', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 0,
        byChannel: {
          email: { sent: 10, read: 0, clicked: 0 },
        },
      });

      const prefs = makePreferences({
        channels: { push: true, email: false, sms: false, inApp: true },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'switch_digest');
      expect(rec).toBeUndefined();
    });
  });

  // ── Rule 4: enable_quiet_hours ──────────────────────────────────────────────

  describe('Rule 4 — enable_quiet_hours', () => {
    it('recommends quiet hours when not set and overall read-rate < 40 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 3, // 30 % read-rate
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'enable_quiet_hours');
      expect(rec).toBeDefined();
      expect(rec!.preferencePatch.quietHours!.enabled).toBe(true);
    });

    it('does NOT recommend quiet hours when already enabled', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 3,
      });

      const prefs = makePreferences({
        quietHours: { enabled: true, start: '22:00', end: '08:00', timezone: 'UTC' },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'enable_quiet_hours');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend quiet hours when read-rate >= 40 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 5, // 50 % read-rate
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'enable_quiet_hours');
      expect(rec).toBeUndefined();
    });
  });

  // ── Rule 5: reduce_frequency ────────────────────────────────────────────────

  describe('Rule 5 — reduce_frequency', () => {
    it('recommends reducing maxPerDay when >= 50 and read-rate < 30 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 2, // 20 % read-rate
      });

      const result = generateRecommendations(analytics, makePreferences()); // maxPerDay = 50
      const rec = result.find((r) => r.type === 'reduce_frequency');
      expect(rec).toBeDefined();
      expect(rec!.preferencePatch.frequency!.maxPerDay).toBe(20);
      expect(rec!.impact).toBe('high');
    });

    it('does NOT recommend reducing frequency when maxPerDay < 50', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 2,
      });

      const prefs = makePreferences({
        frequency: { digest: 'realtime', maxPerDay: 20 },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'reduce_frequency');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend reducing frequency when read-rate >= 30 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 4, // 40 % read-rate
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'reduce_frequency');
      expect(rec).toBeUndefined();
    });
  });

  // ── Rule 6: enable_sms ─────────────────────────────────────────────────────

  describe('Rule 6 — enable_sms', () => {
    it('recommends enabling SMS when push read-rate > 70 % and SMS is disabled', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 8,
        byChannel: {
          push: { sent: 10, read: 8, clicked: 3 }, // 80 % read-rate
        },
      });

      const result = generateRecommendations(analytics, makePreferences()); // sms: false
      const rec = result.find((r) => r.type === 'enable_sms');
      expect(rec).toBeDefined();
      expect(rec!.preferencePatch.channels!.sms).toBe(true);
    });

    it('does NOT recommend enabling SMS when already enabled', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 8,
        byChannel: {
          push: { sent: 10, read: 8, clicked: 3 },
        },
      });

      const prefs = makePreferences({
        channels: { push: true, email: true, sms: true, inApp: true },
      });

      const result = generateRecommendations(analytics, prefs);
      const rec = result.find((r) => r.type === 'enable_sms');
      expect(rec).toBeUndefined();
    });

    it('does NOT recommend SMS when push read-rate <= 70 %', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 7,
        byChannel: {
          push: { sent: 10, read: 6, clicked: 2 }, // 60 % read-rate
        },
      });

      const result = generateRecommendations(analytics, makePreferences());
      const rec = result.find((r) => r.type === 'enable_sms');
      expect(rec).toBeUndefined();
    });
  });

  // ── Deterministic IDs & deduplication ──────────────────────────────────────

  describe('deterministic IDs', () => {
    it('generates the same ID for the same signal on repeated calls', () => {
      const analytics = makeAnalytics({
        totalSent: 10,
        totalRead: 2,
      });

      const result1 = generateRecommendations(analytics, makePreferences());
      const result2 = generateRecommendations(analytics, makePreferences());

      const ids1 = result1.map((r) => r.id);
      const ids2 = result2.map((r) => r.id);

      expect(ids1).toEqual(ids2);
    });
  });

  // ── Sort order ─────────────────────────────────────────────────────────────

  describe('sort order', () => {
    it('returns recommendations sorted by impact: high → medium → low', () => {
      // Craft analytics to trigger all three impact levels:
      // - reduce_frequency → high
      // - disable_category medium → medium (read 15 %)
      // - enable_quiet_hours → low
      const analytics = makeAnalytics({
        totalSent: 20,
        totalRead: 4, // 20 % overall — triggers quiet_hours (< 40%) and reduce_frequency (< 30%)
        byCategory: {
          system: { sent: 20, read: 3, clicked: 0 }, // 15 % — medium disable
        },
      });

      const result = generateRecommendations(analytics, makePreferences());

      const impactValues = result.map((r) => r.impact);
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const isSorted = impactValues.every((val, i) =>
        i === 0 ? true : impactOrder[val] >= impactOrder[impactValues[i - 1]],
      );
      expect(isSorted).toBe(true);
    });
  });
});
