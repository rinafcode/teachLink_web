import { z } from 'zod';
import type { VideoNote, ApiResponse, SuccessResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

const lessonIdField = z
  .string({ required_error: 'lessonId is required' })
  .min(1, 'lessonId is required');
const userIdField = z.string().optional();
const noteIdField = z
  .string({ required_error: 'Note ID is required' })
  .min(1, 'Note ID is required');
const timeField = z
  .number({ required_error: 'time is required' })
  .finite()
  .nonnegative('time must be >= 0');
const textField = z
  .string({ required_error: 'text is required' })
  .min(1, 'text is required')
  .transform((v) => v.trim());

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const NotesGetQuerySchema = z.object({
  lessonId: lessonIdField,
  userId: userIdField,
});

export const NotesCreateBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  note: z.object({
    id: z.string().optional(),
    time: timeField,
    text: textField,
  }),
});

export const NotesPatchBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  id: noteIdField,
  text: textField,
  time: timeField.optional(),
});

export const NotesDeleteBodySchema = z.object({
  userId: userIdField,
  lessonId: lessonIdField,
  id: noteIdField,
});

// ---------------------------------------------------------------------------
// DTO types inferred from schemas
// ---------------------------------------------------------------------------

export type NotesGetQueryDTO = z.infer<typeof NotesGetQuerySchema>;
export type NotesCreateBodyDTO = z.infer<typeof NotesCreateBodySchema>;
export type NotesPatchBodyDTO = z.infer<typeof NotesPatchBodySchema>;
export type NotesDeleteBodyDTO = z.infer<typeof NotesDeleteBodySchema>;

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export type VideoNoteDTO = VideoNote;
export type NotesListResponseDTO = ApiResponse<VideoNoteDTO[]>;
export type NoteResponseDTO = ApiResponse<VideoNoteDTO>;
export type NotesSuccessResponseDTO = SuccessResponse;
