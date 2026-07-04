import { query } from '../pool';
import type { VideoNote } from '@/types/api';

/**
 * Notes Repository
 * Handles CRUD operations for video notes in PostgreSQL
 */

export async function findByUserAndLesson(
  userId: string | undefined,
  lessonId: string
): Promise<VideoNote[]> {
  const result = await query(
    `SELECT id, time_seconds as time, text, created_at, updated_at
     FROM notes
     WHERE (user_id = $1 OR ($1 IS NULL AND user_id IS NULL))
       AND lesson_id = $2
     ORDER BY created_at DESC`,
    [userId ?? null, lessonId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    time: parseFloat(row.time),
    text: row.text,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function create(
  userId: string | undefined,
  lessonId: string,
  note: { id: string; time: number; text: string }
): Promise<VideoNote> {
  const now = new Date();

  await query(
    `INSERT INTO notes (id, user_id, lesson_id, time_seconds, text, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       time_seconds = EXCLUDED.time_seconds,
       text = EXCLUDED.text,
       updated_at = EXCLUDED.updated_at`,
    [note.id, userId ?? null, lessonId, note.time, note.text, now, now]
  );

  return {
    id: note.id,
    time: note.time,
    text: note.text,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function update(
  id: string,
  userId: string | undefined,
  lessonId: string,
  data: { text: string; time?: number }
): Promise<void> {
  const now = new Date();

  if (data.time !== undefined) {
    await query(
      `UPDATE notes
       SET text = $1, time_seconds = $2, updated_at = $3
       WHERE id = $4
         AND (user_id = $5 OR ($5 IS NULL AND user_id IS NULL))
         AND lesson_id = $6`,
      [data.text, data.time, now, id, userId ?? null, lessonId]
    );
  } else {
    await query(
      `UPDATE notes
       SET text = $1, updated_at = $2
       WHERE id = $3
         AND (user_id = $4 OR ($4 IS NULL AND user_id IS NULL))
         AND lesson_id = $5`,
      [data.text, now, id, userId ?? null, lessonId]
    );
  }
}

export async function remove(
  id: string,
  userId: string | undefined,
  lessonId: string
): Promise<void> {
  await query(
    `DELETE FROM notes
     WHERE id = $1
       AND (user_id = $2 OR ($2 IS NULL AND user_id IS NULL))
       AND lesson_id = $3`,
    [id, userId ?? null, lessonId]
  );
}
