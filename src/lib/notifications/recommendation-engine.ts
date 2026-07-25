/**
 * Notification Preference Recommendation Engine
 *
 * A pure, stateless function that analyses NotificationAnalytics and the
 * user's current UserNotificationPreferences and returns a prioritised list
 * of NotificationRecommendation objects, each carrying a preferencePatch
 * that can be applied directly via updatePreferences().
 *
 * Rules:
 *  1. disable_category  — category read-rate < 20 %
 *  2. add_channel       — category click-rate > 60 % but push not enabled
 *  3. switch_digest     — email channel read-rate < 10 %
 *  4. enable_quiet_hours— quiet hours not set + overall read-rate < 40 %
 *  5. reduce_frequency  — maxPerDay >= 50 and overall read-rate < 30 %
 *  6. enable_sms        — push read-rate > 70 % and SMS globally disabled
 */

import {
  NotificationAnalytics,
  NotificationCategory,
  NotificationRecommendation,
  UserNotificationPreferences,
} from './types';

// ─── Thresholds ────────────────────────────────────────────────────────────────

const LOW_READ_RATE = 20; // % — below this → suggest disabling category
const HIGH_CLICK_RATE = 60; // % — above this → suggest adding push
const LOW_EMAIL_READ_RATE = 10; // % — below this → suggest digest mode
const QUIET_READ_RATE = 40; // % — below this (overall) → suggest quiet hours
const HIGH_FREQ_READ_RATE = 30; // % — below this at maxPerDay ≥ 50 → suggest reducing
const HIGH_PUSH_READ_RATE = 70; // % — above this → suggest SMS

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Build a deterministic ID so the same signal always produces the same ID.
 * This lets the UI persist dismissed IDs across renders.
 */
function makeId(...parts: string[]): string {
  return `rec_${parts.join('_')}`;
}

// ─── Engine ────────────────────────────────────────────────────────────────────

/**
 * Generate notification preference recommendations based on analytics data.
 *
 * @param analytics - NotificationAnalytics produced by calculateAnalytics()
 * @param preferences - The user's current UserNotificationPreferences
 * @returns Array of NotificationRecommendation objects, ordered by impact (high → low)
 */
export function generateRecommendations(
  analytics: NotificationAnalytics,
  preferences: UserNotificationPreferences,
): NotificationRecommendation[] {
  // No data → no recommendations
  if (analytics.totalSent === 0) return [];

  const recommendations: NotificationRecommendation[] = [];

  const overallReadRate = pct(analytics.totalRead, analytics.totalSent);

  // ── Rule 1: disable_category ─────────────────────────────────────────────────
  // For each category that has been sent ≥ 5 notifications but has a read-rate
  // below LOW_READ_RATE, recommend disabling it.

  const categoryKeys = Object.keys(analytics.byCategory) as NotificationCategory[];

  for (const category of categoryKeys) {
    const catStats = analytics.byCategory[category];
    const catPrefs = preferences.categories[category];

    if (!catPrefs?.enabled) continue; // already disabled
    if (catStats.sent < 5) continue; // not enough data

    const readRate = pct(catStats.read, catStats.sent);

    if (readRate < LOW_READ_RATE) {
      recommendations.push({
        id: makeId('disable_category', category),
        type: 'disable_category',
        title: `Disable "${formatCategory(category)}" notifications`,
        description: `Only ${readRate.toFixed(0)}% of "${formatCategory(
          category,
        )}" notifications are read. Disabling this category will reduce noise.`,
        impact: readRate < 10 ? 'high' : 'medium',
        category,
        preferencePatch: {
          categories: {
            ...preferences.categories,
            [category]: {
              ...catPrefs,
              enabled: false,
            },
          },
        },
      });
    }
  }

  // ── Rule 2: add_channel (push) ────────────────────────────────────────────────
  // For each category with click-rate > HIGH_CLICK_RATE but push not in its channels,
  // recommend adding the push channel.

  for (const category of categoryKeys) {
    const catStats = analytics.byCategory[category];
    const catPrefs = preferences.categories[category];

    if (!catPrefs?.enabled) continue;
    if (catStats.sent < 5) continue;
    if (!preferences.channels.push) continue; // push globally disabled
    if (catPrefs.channels.includes('push')) continue; // already has push

    const clickRate = pct(catStats.clicked, catStats.sent);

    if (clickRate > HIGH_CLICK_RATE) {
      recommendations.push({
        id: makeId('add_channel', category, 'push'),
        type: 'add_channel',
        title: `Enable push for "${formatCategory(category)}"`,
        description: `${clickRate.toFixed(0)}% of "${formatCategory(
          category,
        )}" notifications are clicked — you'd benefit from instant push delivery.`,
        impact: 'medium',
        category,
        channel: 'push',
        preferencePatch: {
          categories: {
            ...preferences.categories,
            [category]: {
              ...catPrefs,
              channels: [...catPrefs.channels, 'push'],
            },
          },
        },
      });
    }
  }

  // ── Rule 3: switch_digest ─────────────────────────────────────────────────────
  // Email channel read-rate below LOW_EMAIL_READ_RATE → suggest digest mode
  // (only when currently on realtime).

  if (preferences.channels.email && preferences.frequency.digest === 'realtime') {
    const emailStats = analytics.byChannel['email'];
    if (emailStats && emailStats.sent >= 5) {
      const emailReadRate = pct(emailStats.read, emailStats.sent);

      if (emailReadRate < LOW_EMAIL_READ_RATE) {
        recommendations.push({
          id: makeId('switch_digest', 'daily'),
          type: 'switch_digest',
          title: 'Switch email to daily digest',
          description: `Only ${emailReadRate.toFixed(
            0,
          )}% of email notifications are read immediately. A daily digest reduces inbox clutter while keeping you informed.`,
          impact: 'medium',
          channel: 'email',
          preferencePatch: {
            frequency: {
              ...preferences.frequency,
              digest: 'daily',
            },
          },
        });
      }
    }
  }

  // ── Rule 4: enable_quiet_hours ───────────────────────────────────────────────
  // If quiet hours are not enabled and overall read-rate is below QUIET_READ_RATE,
  // suggest enabling them with sensible defaults.

  if (!preferences.quietHours.enabled && overallReadRate < QUIET_READ_RATE) {
    recommendations.push({
      id: makeId('enable_quiet_hours'),
      type: 'enable_quiet_hours',
      title: 'Enable quiet hours',
      description: `Your overall read rate is ${overallReadRate.toFixed(
        0,
      )}%. Enabling quiet hours (e.g. 22:00–08:00) can reduce interruptions during low-engagement periods.`,
      impact: 'low',
      preferencePatch: {
        quietHours: {
          ...preferences.quietHours,
          enabled: true,
          start: preferences.quietHours.start || '22:00',
          end: preferences.quietHours.end || '08:00',
        },
      },
    });
  }

  // ── Rule 5: reduce_frequency ──────────────────────────────────────────────────
  // maxPerDay >= 50 and overall read-rate < HIGH_FREQ_READ_RATE → reduce to 20.

  if (preferences.frequency.maxPerDay >= 50 && overallReadRate < HIGH_FREQ_READ_RATE) {
    recommendations.push({
      id: makeId('reduce_frequency'),
      type: 'reduce_frequency',
      title: 'Reduce daily notification limit',
      description: `You receive up to ${
        preferences.frequency.maxPerDay
      } notifications/day but only read ${overallReadRate.toFixed(
        0,
      )}% of them. Lowering the limit to 20 will surface the most important ones.`,
      impact: 'high',
      preferencePatch: {
        frequency: {
          ...preferences.frequency,
          maxPerDay: 20,
        },
      },
    });
  }

  // ── Rule 6: enable_sms ────────────────────────────────────────────────────────
  // Push read-rate > HIGH_PUSH_READ_RATE but SMS is globally disabled →
  // suggest enabling SMS for high-priority categories.

  if (!preferences.channels.sms) {
    const pushStats = analytics.byChannel['push'];
    if (pushStats && pushStats.sent >= 5) {
      const pushReadRate = pct(pushStats.read, pushStats.sent);

      if (pushReadRate > HIGH_PUSH_READ_RATE) {
        recommendations.push({
          id: makeId('enable_sms'),
          type: 'enable_sms',
          title: 'Consider enabling SMS for critical alerts',
          description: `You read ${pushReadRate.toFixed(
            0,
          )}% of push notifications. Adding SMS ensures you never miss urgent or payment notifications even when your device is silenced.`,
          impact: 'low',
          channel: 'sms',
          preferencePatch: {
            channels: {
              ...preferences.channels,
              sms: true,
            },
          },
        });
      }
    }
  }

  // ── Sort by impact: high → medium → low ──────────────────────────────────────

  const impactOrder: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return recommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCategory(category: NotificationCategory): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
