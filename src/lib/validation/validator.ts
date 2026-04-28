import { z } from 'zod';

export class ValidationError extends Error {
  constructor(public errors: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Validates data against a schema and returns the typed data.
 * Throws a ValidationError if validation fails.
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Validation Error Details:', result.error.format());
    }
    throw new ValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Validates data and returns a safe result object.
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
