/**
 * Referral Code Utilities
 *
 * This module provides utilities for generating and validating referral codes
 * as part of the Authentication Flow Referral Program implementation.
 *
 * Persistence is backed by PostgreSQL (see
 * `src/lib/db/repositories/referrals.repository.ts` and
 * `src/lib/db/migrations/005_create_referrals_table.sql`) — codes and
 * referral counts survive server restarts.
 */

import * as referralsRepo from './db/repositories/referrals.repository';

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
export async function canUseReferralCode(
  referralCode: string,
  userEmail: string,
): Promise<boolean> {
  const ownerEmail = await referralsRepo.getOwnerEmail(referralCode);
  if (!ownerEmail) return true; // unknown codes are handled separately by referralCodeExists
  return ownerEmail.toLowerCase() !== userEmail.toLowerCase();
}

/**
 * Persists a referral code for a user in the database.
 * @param email The user's email
 * @param referralCode The referral code
 * @param ownerId Optional user id to associate with the code, when known
 */
export async function storeReferralCode(
  email: string,
  referralCode: string,
  ownerId?: string | null,
): Promise<void> {
  await referralsRepo.create(referralCode, email, ownerId ?? null);
}

/**
 * Checks whether a referral code exists, querying the database.
 * @param referralCode The referral code to check
 * @returns true if the referral code exists, false otherwise
 */
export async function referralCodeExists(referralCode: string): Promise<boolean> {
  return referralsRepo.exists(referralCode);
}

/**
 * Gets the owner of a referral code.
 * @param referralCode The referral code
 * @returns The email of the owner, or undefined if not found
 */
export async function getReferralCodeOwner(referralCode: string): Promise<string | undefined> {
  return referralsRepo.getOwnerEmail(referralCode);
}

/**
 * Records a successful referral (a new signup that used `referralCode`) and
 * increments the referral count in the database. Idempotent per
 * (referralCode, referredEmail) — replaying the same signup does not
 * double-count.
 * @param referralCode The referral code that was used
 * @param referredEmail The email of the user who signed up using the code
 * @param referredUserId Optional id of the newly created user
 */
export async function incrementReferralCount(
  referralCode: string,
  referredEmail: string,
  referredUserId?: string | null,
): Promise<void> {
  await referralsRepo.recordReferral(referralCode, referredEmail, referredUserId ?? null);
}

/**
 * Gets the referral count for a referral code from the database
 * (`SELECT COUNT(*)` over the `referred_users` join table).
 * @param referralCode The referral code
 * @returns The number of successful referrals made with this code
 */
export async function getReferralCount(referralCode: string): Promise<number> {
  return referralsRepo.getReferralCount(referralCode);
}
