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
