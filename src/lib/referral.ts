/**
 * Referral Code Utilities
 * 
 * This module provides utilities for generating and validating referral codes
 * as part of the Authentication Flow Referral Program implementation.
 */

const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion

/**
 * Generates a unique referral code
 * @returns A unique 8-character referral code
 */
export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * REFERRAL_CODE_CHARSET.length);
    code += REFERRAL_CODE_CHARSET[randomIndex];
  }
  return code;
}

/**
 * Validates a referral code format
 * @param code The referral code to validate
 * @returns true if the code format is valid, false otherwise
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (!code || code.length !== REFERRAL_CODE_LENGTH) {
    return false;
  }
  
  // Check that all characters are valid
  for (const char of code) {
    if (!REFERRAL_CODE_CHARSET.includes(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates a referral code format and provides error details
 * @param code The referral code to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateReferralCode(code: string): { isValid: boolean; error?: string } {
  if (!code) {
    return { isValid: false, error: 'Referral code is required' };
  }
  
  if (code.length !== REFERRAL_CODE_LENGTH) {
    return { isValid: false, error: 'Referral code must be 8 characters' };
  }
  
  for (const char of code) {
    if (!REFERRAL_CODE_CHARSET.includes(char)) {
      return { isValid: false, error: 'Referral code contains invalid characters' };
    }
  }
  
  return { isValid: true };
}

/**
 * Checks if a referral code belongs to a specific user (prevents self-referral)
 * @param referralCode The referral code to check
 * @param userEmail The email of the user attempting to use the code
 * @returns true if the user can use this referral code, false if it's their own
 */
export function canUseReferralCode(referralCode: string, userEmail: string): boolean {
  // In a real implementation, this would check against the database
  // For now, we'll implement a basic check that can be extended
  // This is a placeholder - actual implementation would query the database
  // to ensure the referral code doesn't belong to the same user
  return true;
}

/**
 * Mock storage for referral codes (in production, this would be a database)
 * This is used for the mock implementation in the authentication flow
 */
const mockReferralCodes = new Map<string, { email: string; referralCount: number }>();

/**
 * Stores a referral code for a user (mock implementation)
 * @param email The user's email
 * @param referralCode The referral code
 */
export function storeReferralCode(email: string, referralCode: string): void {
  mockReferralCodes.set(referralCode, { email, referralCount: 0 });
}

/**
 * Validates if a referral code exists (mock implementation)
 * @param referralCode The referral code to check
 * @returns true if the referral code exists, false otherwise
 */
export function referralCodeExists(referralCode: string): boolean {
  return mockReferralCodes.has(referralCode);
}

/**
 * Gets the owner of a referral code (mock implementation)
 * @param referralCode The referral code
 * @returns The email of the owner, or undefined if not found
 */
export function getReferralCodeOwner(referralCode: string): string | undefined {
  return mockReferralCodes.get(referralCode)?.email;
}

/**
 * Increments the referral count for a referral code (mock implementation)
 * @param referralCode The referral code
 */
export function incrementReferralCount(referralCode: string): void {
  const data = mockReferralCodes.get(referralCode);
  if (data) {
    data.referralCount++;
    mockReferralCodes.set(referralCode, data);
  }
}

/**
 * Gets the referral count for a referral code (mock implementation)
 * @param referralCode The referral code
 * @returns The number of referrals made with this code
 */
export function getReferralCount(referralCode: string): number {
  return mockReferralCodes.get(referralCode)?.referralCount || 0;
}