import { describe, it, expect } from "vitest";
import { z } from "zod";

// ==========================================
// --- 1. CORE IMPLEMENTATION CODE ---
// ==========================================

// Task 1: Canonical minimum source of truth defined in exactly one place (src/constants/auth.ts)
export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  ERROR_MESSAGE: "Password must be at least 8 characters long.",
};

/**
 * Mock representation of: src/app/lib/validationSchemas.ts
 * Previously used min(1) for login and min(6) for signup
 */
export const ClientValidationSchema = z.object({
  loginPassword: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, {
    message: AUTH_CONSTANTS.ERROR_MESSAGE,
  }),
  signupPassword: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, {
    message: AUTH_CONSTANTS.ERROR_MESSAGE,
  }),
});

/**
 * Mock representation of: src/types/api/auth.dto.ts
 * Previously used min(6)
 */
export const AuthDtoSchema = z.object({
  password: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, {
    message: AUTH_CONSTANTS.ERROR_MESSAGE,
  }),
});

/**
 * Mock representation of: src/schemas/auth.schema.ts
 * Previously used min(8)
 */
export const BackendAuthSchema = z.object({
  password: z.string().min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, {
    message: AUTH_CONSTANTS.ERROR_MESSAGE,
  }),
});

// ==========================================
// --- 2. TDD AUTOMATED TEST SUITE ---
// ==========================================

describe("TDD - Centralized Password Length Schema Standardization", () => {
  const shortPassword = "abc1234"; // 7 characters - should fail everywhere
  const validPassword = "abc12345"; // 8 characters - should pass everywhere

  it("should reject a 7-character password across all three structural validation schemas with identical error messages", () => {
    // 1. Test Client Forms Layer Validation
    const clientLoginResult = ClientValidationSchema.safeParse({
      loginPassword: shortPassword,
      signupPassword: validPassword,
    });
    expect(clientLoginResult.success).toBe(false);
    if (!clientLoginResult.success) {
      expect(clientLoginResult.error.errors[0].message).toBe(AUTH_CONSTANTS.ERROR_MESSAGE);
    }

    const clientSignupResult = ClientValidationSchema.safeParse({
      loginPassword: validPassword,
      signupPassword: shortPassword,
    });
    expect(clientSignupResult.success).toBe(false);
    if (!clientSignupResult.success) {
      expect(clientSignupResult.error.errors[0].message).toBe(AUTH_CONSTANTS.ERROR_MESSAGE);
    }

    // 2. Test API DTO Layer Validation
    const dtoResult = AuthDtoSchema.safeParse({ password: shortPassword });
    expect(dtoResult.success).toBe(false);
    if (!dtoResult.success) {
      expect(dtoResult.error.errors[0].message).toBe(AUTH_CONSTANTS.ERROR_MESSAGE);
    }

    // 3. Test Core Backend Storage Schema Validation
    const backendResult = BackendAuthSchema.safeParse({ password: shortPassword });
    expect(backendResult.success).toBe(false);
    if (!backendResult.success) {
      expect(backendResult.error.errors[0].message).toBe(AUTH_CONSTANTS.ERROR_MESSAGE);
    }
  });

  it("should successfully validate an 8-character password across all three validation boundaries smoothly", () => {
    const clientResult = ClientValidationSchema.safeParse({
      loginPassword: validPassword,
      signupPassword: validPassword,
    });
    const dtoResult = AuthDtoSchema.safeParse({ password: validPassword });
    const backendResult = BackendAuthSchema.safeParse({ password: validPassword });

    expect(clientResult.success).toBe(true);
    expect(dtoResult.success).toBe(true);
    expect(backendResult.success).toBe(true);
  });
});