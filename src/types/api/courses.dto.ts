import { z } from 'zod';
import type { Course, ApiResponse, PaginatedResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const CourseListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  cursor: z.string().optional(),
});

export const CourseByIdParamsSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
});

// ---------------------------------------------------------------------------
// DTO types inferred from schemas
// ---------------------------------------------------------------------------

export type CourseListQueryDTO = z.infer<typeof CourseListQuerySchema>;
export type CourseByIdParamsDTO = z.infer<typeof CourseByIdParamsSchema>;

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export type CourseDTO = Course;
export type CourseListResponseDTO = PaginatedResponse<CourseDTO>;
export type CourseResponseDTO = ApiResponse<CourseDTO>;
