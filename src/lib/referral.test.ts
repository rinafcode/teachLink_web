import { describe, it, expect, vi } from 'vitest';

/**
 * Unit tests for src/lib/referral.ts exports
 *
 * This test file verifies that all referral helper functions are properly
 * exported from the referral module, which is the core requirement of bug #713:
 * "Signup route calls referral helpers that are never imported"
 *
 * The test focuses on:
 * 1. All functions referenced in the signup route are exported
 * 2. Functions have correct signatures
 * 3. Validation logic works for format checking
 */

describe('Bug #713: Referral function exports', () => {
  /**
   * Test: All referral helpers required by signup route are exported
   * This is the main acceptance criterion for bug #713
   */
  it('should export all referral helpers required by the signup route', async () => {
    // Import the module
    const referralModule = await import('./referral');

    // These are the exact functions called in src/app/api/auth/signup/route.ts
    expect(typeof referralModule.generateReferralCode).toBe('function');
    expect(typeof referralModule.validateReferralCode).toBe('function');
    expect(typeof referralModule.referralCodeExists).toBe('function');
    expect(typeof referralModule.getReferralCodeOwner).toBe('function');
    expect(typeof referralModule.storeReferralCode).toBe('function');
    expect(typeof referralModule.incrementReferralCount).toBe('function');
  });

  /**
   * Test: Referral code generation works correctly
   */
  it('generateReferralCode should produce valid 8-character codes', async () => {
    const { generateReferralCode } = await import('./referral');

    const codes = new Set();
    for (let i = 0; i < 10; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(/^[A-Z23456789]{8}$/);
      codes.add(code);
    }
    // Should generate different codes (collision unlikely)
    expect(codes.size).toBeGreaterThan(8);
  });

  /**
   * Test: Referral code format validation works correctly
   */
  it('validateReferralCode should correctly identify valid and invalid codes', async () => {
    const { validateReferralCode } = await import('./referral');

    // Valid codes (8 characters from the charset)
    expect(validateReferralCode('ABCD2345').isValid).toBe(true);
    expect(validateReferralCode('ZZZZZZZZ').isValid).toBe(true);
    expect(validateReferralCode('2345ABCD').isValid).toBe(true);

    // Invalid - empty
    expect(validateReferralCode('').isValid).toBe(false);

    // Invalid - too short
    expect(validateReferralCode('SHORT').isValid).toBe(false);

    // Invalid - too long
    expect(validateReferralCode('TOOLONG99').isValid).toBe(false);

    // Invalid - contains forbidden characters (I, O, 0, 1)
    expect(validateReferralCode('TEST0000').isValid).toBe(false);
    expect(validateReferralCode('TEST1111').isValid).toBe(false);
    expect(validateReferralCode('TESTI000').isValid).toBe(false);
    expect(validateReferralCode('TESTO000').isValid).toBe(false);

    // Invalid - lowercase or special chars
    expect(validateReferralCode('testcode').isValid).toBe(false);
    expect(validateReferralCode('TEST@000').isValid).toBe(false);
  });

  /**
   * Test: Referral code format validator
   */
  it('isValidReferralCodeFormat should validate code format', async () => {
    const { isValidReferralCodeFormat } = await import('./referral');

    // Valid formats
    expect(isValidReferralCodeFormat('ABCD2345')).toBe(true);
    expect(isValidReferralCodeFormat('ZZZZZZZZ')).toBe(true);

    // Invalid formats
    expect(isValidReferralCodeFormat('SHORT')).toBe(false);
    expect(isValidReferralCodeFormat('TOOLONGCODE')).toBe(false);
    expect(isValidReferralCodeFormat('TEST0000')).toBe(false);
  });

  /**
   * Test: Async functions have correct signatures
   */
  it('should export async functions with correct signatures', async () => {
    const {
      referralCodeExists,
      getReferralCodeOwner,
      storeReferralCode,
      incrementReferralCount,
      canUseReferralCode,
      getReferralCount,
    } = await import('./referral');

    // These should be async functions (return Promises)
    expect(typeof referralCodeExists).toBe('function');
    expect(typeof getReferralCodeOwner).toBe('function');
    expect(typeof storeReferralCode).toBe('function');
    expect(typeof incrementReferralCount).toBe('function');
    expect(typeof canUseReferralCode).toBe('function');
    expect(typeof getReferralCount).toBe('function');

    // Verify they return Promises (without executing DB calls)
    const spy1 = vi.fn(() => Promise.resolve(true));
    const spy2 = vi.fn(() => Promise.resolve('owner@example.com'));

    // Just verify the functions exist and are of the right type
    expect(referralCodeExists.constructor.name).toBe('AsyncFunction');
    expect(getReferralCodeOwner.constructor.name).toBe('AsyncFunction');
    expect(storeReferralCode.constructor.name).toBe('AsyncFunction');
    expect(incrementReferralCount.constructor.name).toBe('AsyncFunction');
    expect(canUseReferralCode.constructor.name).toBe('AsyncFunction');
    expect(getReferralCount.constructor.name).toBe('AsyncFunction');
  });

  /**
   * Test: Signup route can successfully import all functions
   * This test verifies the imports work as used in the actual signup route
   */
  it('should successfully import functions as the signup route does', async () => {
    // Mimic the import statement from src/app/api/auth/signup/route.ts
    const {
      generateReferralCode,
      getReferralCodeOwner,
      incrementReferralCount,
      referralCodeExists,
      storeReferralCode,
      validateReferralCode,
    } = await import('./referral');

    // All imports should succeed
    expect(generateReferralCode).toBeDefined();
    expect(getReferralCodeOwner).toBeDefined();
    expect(incrementReferralCount).toBeDefined();
    expect(referralCodeExists).toBeDefined();
    expect(storeReferralCode).toBeDefined();
    expect(validateReferralCode).toBeDefined();

    // All should be functions
    expect(typeof generateReferralCode).toBe('function');
    expect(typeof getReferralCodeOwner).toBe('function');
    expect(typeof incrementReferralCount).toBe('function');
    expect(typeof referralCodeExists).toBe('function');
    expect(typeof storeReferralCode).toBe('function');
    expect(typeof validateReferralCode).toBe('function');
  });

  /**
   * Test: validateReferralCode returns correct object shape
   */
  it('validateReferralCode should return object with isValid and optional error properties', async () => {
    const { validateReferralCode } = await import('./referral');

    const validResult = validateReferralCode('ABCD2345');
    expect(validResult).toHaveProperty('isValid');
    expect(validResult.isValid).toBe(true);
    expect(validResult.error).toBeUndefined();

    const invalidResult = validateReferralCode('INVALID');
    expect(invalidResult).toHaveProperty('isValid');
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult).toHaveProperty('error');
    expect(typeof invalidResult.error).toBe('string');
  });

  /**
   * Test: No confusing characters are used
   */
  it('should exclude confusing characters: I, O, 0, 1', async () => {
    const { generateReferralCode, isValidReferralCodeFormat } = await import('./referral');

    // Generate many codes and verify none contain confusing characters
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).not.toContain('I');
      expect(code).not.toContain('O');
      expect(code).not.toContain('0');
      expect(code).not.toContain('1');
      expect(isValidReferralCodeFormat(code)).toBe(true);
    }
  });
});
