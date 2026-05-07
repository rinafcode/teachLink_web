import { NextResponse } from 'next/server';
import { ZodTypeAny, ZodError, z } from 'zod';

// ---------------------------------------------------------------------------
// Discriminated union result type — TypeScript narrows correctly on `.ok`
// ---------------------------------------------------------------------------

type ValidationSuccess<T> = { ok: true; data: T };
type ValidationFailure = { ok: false; error: NextResponse };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ---------------------------------------------------------------------------
// Validates a raw JSON body against a Zod schema
// ---------------------------------------------------------------------------

export function validateBody<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      error: NextResponse.json(
        { success: false, message: formatZodError(result.error) },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data as z.infer<S> };
}

// ---------------------------------------------------------------------------
// Validates URLSearchParams (converted to plain object) against a Zod schema
// ---------------------------------------------------------------------------

export function validateQuery<S extends ZodTypeAny>(
  schema: S,
  searchParams: URLSearchParams,
): ValidationResult<z.infer<S>> {
  const raw = Object.fromEntries(searchParams.entries());
  return validateBody(schema, raw);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatZodError(error: ZodError): string {
  return error.errors.map((e) => e.message).join('; ');
}
