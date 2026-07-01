import { z } from 'zod';

export const UserProgressSchema = z.object({
  streak: z.number().int().nonnegative(),
  totalTimeSpent: z.number().nonnegative(),
  dailyGoal: z.number().nonnegative(),
  lastActive: z.string(),
  completedCourses: z.number().int().nonnegative(),
  totalCourses: z.number().int().nonnegative(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;

export const CourseProgressSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  progress: z.number().min(0).max(100),
  completedLessons: z.array(z.string()),
  lastAccessedAt: z.string(),
  completedAt: z.string().optional(),
});

export type CourseProgress = z.infer<typeof CourseProgressSchema>;
