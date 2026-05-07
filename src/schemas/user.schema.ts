import { z } from 'zod';

export const UserRoleSchema = z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'GUEST']);

export const UserSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)), // Support both UUID and plain IDs
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: UserRoleSchema,
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
