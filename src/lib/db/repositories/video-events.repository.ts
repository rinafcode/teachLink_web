import { query } from '../pool';

/**
 * Video Events Repository
 * Handles insert operations for video analytics events in PostgreSQL
 */

export async function create(
  userId: string | undefined,
  lessonId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO video_events (user_id, lesson_id, event_type, payload, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId ?? null, lessonId, eventType, JSON.stringify(payload)]
  );
}
