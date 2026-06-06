import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateReferralCode,
  isValidReferralCodeFormat,
  validateReferralCode,
  canUseReferralCode,
  storeReferralCode,
  referralCodeExists,
  getReferralCodeOwner,
  incrementReferralCount,
  getReferralCount,
} from '../referral';

describe('Referral Code Utilities', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    const mockReferralCodes = (global as any).mockReferralCodes || new Map();
    mockReferralCodes.clear();
    (global as any).mockReferralCodes = mockReferralCodes;
  });

  afterEach(() => {
    // Clean up after each test
    const mockReferralCodes = (global as any).mockReferralCodes;
    if (mockReferralCodes) {
      mockReferralCodes.clear();
    }
  });

  describe('generateReferralCode', () => {
    it('should generate a code of correct length', () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should only use valid characters', () => {
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 50; i++) {
        const code = generateReferralCode();
        for (const char of code) {
          expect(validChars).toContain(char);
        }
      }
    });

    it('should not include confusing characters', () => {
      const confusingChars = ['I', 'O', '0', '1'];
      for (let i = 0; i < 50; i++) {
        const code = generateReferralCode();
        for (const char of code) {
          expect(confusingChars).not.toContain(char);
        }
      }
    });
  });

  describe('isValidReferralCodeFormat', () => {
    it('should return true for valid codes', () => {
      expect(isValidReferralCodeFormat('ABCDEFGH')).toBe(true);
      expect(isValidReferralCodeFormat('12345678')).toBe(true);
      expect(isValidReferralCodeFormat('AB12CD34')).toBe(true);
    });

    it('should return false for invalid length', () => {
      expect(isValidReferralCodeFormat('')).toBe(false);
      expect(isValidReferralCodeFormat('ABC')).toBe(false);
      expect(isValidReferralCodeFormat('ABCDEFGH1')).toBe(false);
    });

    it('should return false for invalid characters', () => {
      expect(isValidReferralCodeFormat('ABCDEF0H')).toBe(false); // Contains 0
      expect(isValidReferralCodeFormat('ABCDEFI1')).toBe(false); // Contains I
      expect(isValidReferralCodeFormat('ABCDEFO1')).toBe(false); // Contains O
      expect(isValidReferralCodeFormat('ABCDEF1I')).toBe(false); // Contains 1
    });

    it('should return false for lowercase letters', () => {
      expect(isValidReferralCodeFormat('abcdefgh')).toBe(false);
      expect(isValidReferralCodeFormat('ABCDEFGh')).toBe(false);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate correct codes', () => {
      const result = validateReferralCode('ABCDEFGH');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty code', () => {
      const result = validateReferralCode('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code is required');
    });

    it('should return error for wrong length', () => {
      const result = validateReferralCode('ABC');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code must be 8 characters');
    });

    it('should return error for invalid characters', () => {
      const result = validateReferralCode('ABCDEF0H');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code contains invalid characters');
    });
  });

  describe('canUseReferralCode', () => {
    it('should return true for valid scenario', () => {
      expect(canUseReferralCode('ABCDEFGH', 'user@example.com')).toBe(true);
    });

    it('should return true by default (placeholder implementation)', () => {
      // In the mock implementation, this always returns true
      // In production, this would check against the database
      expect(canUseReferralCode('CODE1234', 'user@example.com')).toBe(true);
    });
  });

  describe('storeReferralCode', () => {
    it('should store a referral code for a user', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(referralCodeExists('ABCDEFGH')).toBe(true);
    });

    it('should store the correct owner email', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(getReferralCodeOwner('ABCDEFGH')).toBe('user@example.com');
    });
  });

  describe('referralCodeExists', () => {
    it('should return false for non-existent codes', () => {
      expect(referralCodeExists('NONEXIST')).toBe(false);
    });

    it('should return true for stored codes', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(referralCodeExists('ABCDEFGH')).toBe(true);
    });
  });

  describe('getReferralCodeOwner', () => {
    it('should return undefined for non-existent codes', () => {
      expect(getReferralCodeOwner('NONEXIST')).toBeUndefined();
    });

    it('should return the owner email for stored codes', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(getReferralCodeOwner('ABCDEFGH')).toBe('user@example.com');
    });
  });

  describe('incrementReferralCount', () => {
    it('should increment the referral count', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(getReferralCount('ABCDEFGH')).toBe(0);
      
      incrementReferralCount('ABCDEFGH');
      expect(getReferralCount('ABCDEFGH')).toBe(1);
      
      incrementReferralCount('ABCDEFGH');
      expect(getReferralCount('ABCDEFGH')).toBe(2);
    });

    it('should not throw for non-existent codes', () => {
      expect(() => incrementReferralCount('NONEXIST')).not.toThrow();
    });
  });

  describe('getReferralCount', () => {
    it('should return 0 for non-existent codes', () => {
      expect(getReferralCount('NONEXIST')).toBe(0);
    });

    it('should return the correct count for stored codes', () => {
      storeReferralCode('user@example.com', 'ABCDEFGH');
      expect(getReferralCount('ABCDEFGH')).toBe(0);
      
      incrementReferralCount('ABCDEFGH');
      expect(getReferralCount('ABCDEFGH')).toBe(1);
    });
  });
});