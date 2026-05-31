import { z } from 'zod';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const TutorialListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  cursor: z.string().optional(),
});

export const CreateTutorialSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
});

export const UpdateProgressSchema = z.object({
  completed: z.boolean(),
  progressPercent: z.number().int().min(0).max(100).optional(),
});

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------

export type TutorialListQueryDTO = z.infer<typeof TutorialListQuerySchema>;
export type CreateTutorialDTO = z.infer<typeof CreateTutorialSchema>;
export type UpdateProgressDTO = z.infer<typeof UpdateProgressSchema>;

export interface TutorialDTO {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

export type TutorialListResponseDTO = PaginatedResponse<TutorialDTO>;
export type TutorialResponseDTO = ApiResponse<TutorialDTO>;
