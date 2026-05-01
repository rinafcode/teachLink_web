import { z } from 'zod';
import type { VideoBookmark, ApiResponse, SuccessResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

const lessonIdField = z
  .string({ required_error: 'lessonId is required' })
  .min(1, 'lessonId is required');
const userIdField = z.string().optional();
const bookmarkIdField = z
  .string({ required_error: 'Bookmark ID is required' })
  .min(1, 'Bookmark ID is required');
const timeField = z
  .number({ required_error: 'time is required' })
  .finite()
  .nonnegative('time must be >= 0');
const titleField = z
  .string({ required_error: 'title is required' })
  .min(1, 'title is required')
  .transform((v) => v.trim());
const noteField = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : undefined));

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const BookmarksGetQuerySchema = z.object({
  lessonId: lessonIdField,
  userId: userIdField,
});

export const BookmarksCreateBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  bookmark: z.object({
    id: z.string().optional(),
    time: timeField,
    title: titleField,
    note: noteField,
  }),
});

export const BookmarksPatchBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  id: bookmarkIdField,
  title: titleField,
  note: noteField,
  time: timeField.optional(),
});

export const BookmarksDeleteBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  id: bookmarkIdField,
});

// ---------------------------------------------------------------------------
// DTO types inferred from schemas
// ---------------------------------------------------------------------------

export type BookmarksGetQueryDTO = z.infer<typeof BookmarksGetQuerySchema>;
export type BookmarksCreateBodyDTO = z.infer<typeof BookmarksCreateBodySchema>;
export type BookmarksPatchBodyDTO = z.infer<typeof BookmarksPatchBodySchema>;
export type BookmarksDeleteBodyDTO = z.infer<typeof BookmarksDeleteBodySchema>;

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export type VideoBookmarkDTO = VideoBookmark;
export type BookmarksListResponseDTO = ApiResponse<VideoBookmarkDTO[]>;
export type BookmarkResponseDTO = ApiResponse<VideoBookmarkDTO>;
export type BookmarksSuccessResponseDTO = SuccessResponse;
