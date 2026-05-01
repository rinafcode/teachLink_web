import { z } from 'zod';
import type { AuthResponse, User } from '@/types/api';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const LoginRequestSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const SignupRequestSchema = z
  .object({
    name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// DTO types inferred from schemas
// ---------------------------------------------------------------------------

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;
export type SignupRequestDTO = z.infer<typeof SignupRequestSchema>;

// ---------------------------------------------------------------------------
// Response DTOs (re-export from shared types for co-location)
// ---------------------------------------------------------------------------

export type AuthUserDTO = User;
export type AuthResponseDTO = AuthResponse;

export interface AuthErrorDTO {
  message: string;
}
