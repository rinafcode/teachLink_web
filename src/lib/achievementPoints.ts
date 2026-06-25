/**
 * Achievement System: Reward Points (#416).
 *
 * Decoupled point-tracking engine. The engine consumes "events" (e.g.,
 * "course_completed", "lesson_finished") and converts them into reward
 * points awarded to a user, applying idempotency by event id.
 */

export type AchievementId = string;

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  points: number;
}

export interface RewardEvent {
  id: string; // unique event id (for idempotency)
  userId: string;
  achievementId: AchievementId;
  occurredAt: string; // ISO datetime
}

export interface UserRewardState {
  userId: string;
  totalPoints: number;
  history: Array<{ eventId: string; achievementId: AchievementId; points: number; at: string }>;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_course',
    name: 'First Course Completed',
    description: 'Awarded the first time a user completes a course.',
    points: 50,
  },
  {
    id: 'streak_7d',
    name: '7-Day Streak',
    description: 'Awarded for seven consecutive active days.',
    points: 100,
  },
  {
    id: 'mentor_review',
    name: 'Mentor Reviewer',
    description: 'Awarded after reviewing five peer submissions.',
    points: 200,
  },
];

export class RewardPointsEngine {
  private achievements = new Map<AchievementId, Achievement>();
  private seenEventIds = new Set<string>();
  private state: UserRewardState;

  constructor(
    userId: string,
    achievements: Achievement[] = DEFAULT_ACHIEVEMENTS,
  ) {
    for (const a of achievements) {
      this.achievements.set(a.id, a);
    }
    this.state = { userId, totalPoints: 0, history: [] };
  }

  listAchievements(): readonly Achievement[] {
    return Array.from(this.achievements.values());
  }

  award(event: RewardEvent): { applied: boolean; points: number; reason?: string } {
    if (event.userId !== this.state.userId) {
      return { applied: false, points: 0, reason: 'user mismatch' };
    }
    if (this.seenEventIds.has(event.id)) {
      return { applied: false, points: 0, reason: 'duplicate event' };
    }
    const a = this.achievements.get(event.achievementId);
    if (!a) {
      return { applied: false, points: 0, reason: 'unknown achievement' };
    }
    this.seenEventIds.add(event.id);
    this.state.totalPoints += a.points;
    this.state.history.push({
      eventId: event.id,
      achievementId: a.id,
      points: a.points,
      at: event.occurredAt,
    });
    return { applied: true, points: a.points };
  }

  getState(): Readonly<UserRewardState> {
    return {
      userId: this.state.userId,
      totalPoints: this.state.totalPoints,
      history: [...this.state.history],
    };
  }

  /**
   * Computes the user's current level based on total points.
   * Levels reset every 500 points; each level unlocks a title.
   */
  level(): { level: number; title: string } {
    const level = Math.floor(this.state.totalPoints / 500) + 1;
    const title =
      level >= 5 ? 'Master' : level >= 3 ? 'Expert' : level >= 2 ? 'Apprentice' : 'Novice';
    return { level, title };
  }
}
