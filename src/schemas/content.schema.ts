import { z } from 'zod';

export const VideoBookmarkSchema = z.object({
  id: z.string().min(1),
  time: z.number().nonnegative(),
  title: z.string().min(1),
  note: z.string().optional(),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});

export const VideoNoteSchema = z.object({
  id: z.string().min(1),
  time: z.number().nonnegative(),
  text: z.string().min(1),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});

export type VideoBookmark = z.infer<typeof VideoBookmarkSchema>;
export type VideoNote = z.infer<typeof VideoNoteSchema>;
