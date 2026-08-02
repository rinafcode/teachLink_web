import { query } from '../pool';
import type { VideoBookmark } from '@/types/api';

/**
 * Bookmarks Repository
 * Handles CRUD operations for video bookmarks in PostgreSQL
 */

export async function findByUserAndLesson(
  userId: string | undefined,
  lessonId: string
): Promise<VideoBookmark[]> {
  const result = await query(
    `SELECT id, time_seconds as time, title, note, created_at, updated_at
     FROM bookmarks
     WHERE (user_id = $1 OR ($1 IS NULL AND user_id IS NULL))
       AND lesson_id = $2
     ORDER BY created_at DESC`,
    [userId ?? null, lessonId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    time: parseFloat(row.time),
    title: row.title,
    note: row.note ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function create(
  userId: string | undefined,
  lessonId: string,
  bookmark: { id: string; time: number; title: string; note?: string }
): Promise<VideoBookmark> {
  const now = new Date();

  await query(
    `INSERT INTO bookmarks (id, user_id, lesson_id, time_seconds, title, note, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       time_seconds = EXCLUDED.time_seconds,
       title = EXCLUDED.title,
       note = EXCLUDED.note,
       updated_at = EXCLUDED.updated_at`,
    [bookmark.id, userId ?? null, lessonId, bookmark.time, bookmark.title, bookmark.note ?? null, now, now]
  );

  return {
    id: bookmark.id,
    time: bookmark.time,
    title: bookmark.title,
    note: bookmark.note,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function update(
  id: string,
  userId: string | undefined,
  lessonId: string,
  data: { title: string; note?: string; time?: number }
): Promise<void> {
  const now = new Date();

  if (data.time !== undefined) {
    await query(
      `UPDATE bookmarks
       SET title = $1, note = $2, time_seconds = $3, updated_at = $4
       WHERE id = $5
         AND (user_id = $6 OR ($6 IS NULL AND user_id IS NULL))
         AND lesson_id = $7`,
      [data.title, data.note ?? null, data.time, now, id, userId ?? null, lessonId]
    );
  } else {
    await query(
      `UPDATE bookmarks
       SET title = $1, note = $2, updated_at = $3
       WHERE id = $4
         AND (user_id = $5 OR ($5 IS NULL AND user_id IS NULL))
         AND lesson_id = $6`,
      [data.title, data.note ?? null, now, id, userId ?? null, lessonId]
    );
  }
}

export async function remove(
  id: string,
  userId: string | undefined,
  lessonId: string
): Promise<void> {
  await query(
    `DELETE FROM bookmarks
     WHERE id = $1
       AND (user_id = $2 OR ($2 IS NULL AND user_id IS NULL))
       AND lesson_id = $3`,
    [id, userId ?? null, lessonId]
  );
}
