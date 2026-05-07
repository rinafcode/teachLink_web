import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructor: z.string().min(1, 'Instructor name is required'),
  duration: z.string().min(1, 'Duration is required'),
  totalLessons: z.number().int().nonnegative(),
  progress: z.number().min(0).max(100),
  category: z.string().min(1, 'Category is required'),
  size: z.string().optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').or(z.string().startsWith('/')),
  downloaded: z.boolean().default(false),
});

export type Course = z.infer<typeof CourseSchema>;
