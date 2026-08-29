import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory fake standing in for the `referrals` / `referred_users` tables so
// this test suite can exercise the real repository + referral.ts wiring
// without a live Postgres instance (no DB is available in CI here — see
// PROCESS NOTES in the workflow this test suite was written under).
interface FakeReferralRow {
  code: string;
  owner_email: string;
  owner_id: string | null;
  referral_count: number;
  created_at: Date;
}

let referrals: Map<string, FakeReferralRow>;
let referredUsers: Set<string>; // `${code}::${email}`

function resetFakeDb() {
  referrals = new Map();
  referredUsers = new Set();
}

vi.mock('../db/pool', () => ({
  query: vi.fn(async (text: string, params: unknown[] = []) => {
    const sql = text.replace(/\s+/g, ' ').trim();

    if (sql.startsWith('INSERT INTO referrals')) {
      const [code, ownerEmail, ownerId] = params as [string, string, string | null];
      if (!referrals.has(code)) {
        referrals.set(code, {
          code,
          owner_email: ownerEmail,
          owner_id: ownerId,
          referral_count: 0,
          created_at: new Date(),
        });
      }
      return { rows: [] };
    }

    if (sql.startsWith('SELECT code, owner_email, owner_id, referral_count, created_at')) {
      const [code] = params as [string];
      const row = referrals.get(code);
      return { rows: row ? [row] : [] };
    }

    if (sql.startsWith('SELECT 1 FROM referrals')) {
      const [code] = params as [string];
      return { rows: referrals.has(code) ? [{ '?column?': 1 }] : [] };
    }

    if (sql.startsWith('SELECT owner_email FROM referrals')) {
      const [code] = params as [string];
      const row = referrals.get(code);
      return { rows: row ? [{ owner_email: row.owner_email }] : [] };
    }

    if (sql.startsWith('INSERT INTO referred_users')) {
      const [code, referredEmail] = params as [string, string, string | null];
      const key = `${code}::${referredEmail}`;
      if (referredUsers.has(key)) {
        return { rows: [] }; // ON CONFLICT DO NOTHING
      }
      referredUsers.add(key);
      return { rows: [{ id: `ru_${key}` }] };
    }

    if (sql.startsWith('UPDATE referrals SET referral_count')) {
      const [code] = params as [string];
      const row = referrals.get(code);
      if (row) row.referral_count += 1;
      return { rows: [] };
    }

    if (sql.startsWith('SELECT COUNT(*)::int AS count FROM referred_users')) {
      const [code] = params as [string];
      const count = Array.from(referredUsers).filter((key) => key.startsWith(`${code}::`)).length;
      return { rows: [{ count }] };
    }

    throw new Error(`Unhandled fake query: ${sql}`);
  }),
}));

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
    resetFakeDb();
    vi.clearAllMocks();
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
      // Charset excludes 0/1/I/O, so '1' cannot appear in a valid code.
      expect(isValidReferralCodeFormat('23456789')).toBe(true);
      expect(isValidReferralCodeFormat('AB23CD34')).toBe(true);
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
    it('should return true for an unknown code (existence is checked separately)', async () => {
      await expect(canUseReferralCode('CODE1234', 'user@example.com')).resolves.toBe(true);
    });

    it('should return false when the code belongs to the same user (self-referral)', async () => {
      await storeReferralCode('owner@example.com', 'ABCDEFGH');
      await expect(canUseReferralCode('ABCDEFGH', 'owner@example.com')).resolves.toBe(false);
    });

    it('should return true when the code belongs to a different user', async () => {
      await storeReferralCode('owner@example.com', 'ABCDEFGH');
      await expect(canUseReferralCode('ABCDEFGH', 'someone-else@example.com')).resolves.toBe(true);
    });
  });

  describe('storeReferralCode', () => {
    it('should persist a referral code for a user', async () => {
      await storeReferralCode('user@example.com', 'ABCDEFGH');
      await expect(referralCodeExists('ABCDEFGH')).resolves.toBe(true);
    });

    it('should store the correct owner email', async () => {
      await storeReferralCode('user@example.com', 'ABCDEFGH');
      await expect(getReferralCodeOwner('ABCDEFGH')).resolves.toBe('user@example.com');
    });
  });

  describe('referralCodeExists', () => {
    it('should return false for non-existent codes', async () => {
      await expect(referralCodeExists('NONEXIST')).resolves.toBe(false);
    });

    it('should return true for stored codes', async () => {
      await storeReferralCode('user@example.com', 'ABCDEFGH');
      await expect(referralCodeExists('ABCDEFGH')).resolves.toBe(true);
    });
  });

  describe('getReferralCodeOwner', () => {
    it('should return undefined for non-existent codes', async () => {
      await expect(getReferralCodeOwner('NONEXIST')).resolves.toBeUndefined();
    });

    it('should return the owner email for stored codes', async () => {
      await storeReferralCode('user@example.com', 'ABCDEFGH');
      await expect(getReferralCodeOwner('ABCDEFGH')).resolves.toBe('user@example.com');
    });
  });

  describe('incrementReferralCount / getReferralCount', () => {
    it('should increment the referral count for distinct referred users', async () => {
      await storeReferralCode('owner@example.com', 'ABCDEFGH');
      await expect(getReferralCount('ABCDEFGH')).resolves.toBe(0);

      await incrementReferralCount('ABCDEFGH', 'friend1@example.com');
      await expect(getReferralCount('ABCDEFGH')).resolves.toBe(1);

      await incrementReferralCount('ABCDEFGH', 'friend2@example.com');
      await expect(getReferralCount('ABCDEFGH')).resolves.toBe(2);
    });

    it('should not double-count the same referred email twice', async () => {
      await storeReferralCode('owner@example.com', 'ABCDEFGH');

      await incrementReferralCount('ABCDEFGH', 'friend1@example.com');
      await incrementReferralCount('ABCDEFGH', 'friend1@example.com');

      await expect(getReferralCount('ABCDEFGH')).resolves.toBe(1);
    });

    it('should not throw for non-existent codes', async () => {
      await expect(incrementReferralCount('NONEXIST', 'friend@example.com')).resolves.not.toThrow();
    });

    it('should return 0 for non-existent codes', async () => {
      await expect(getReferralCount('NONEXIST')).resolves.toBe(0);
    });

    it('persists across separate calls, simulating survival across a server restart', async () => {
      await storeReferralCode('owner@example.com', 'ABCDEFGH');
      await incrementReferralCount('ABCDEFGH', 'friend1@example.com');

      // No in-memory Map is used anymore — every read goes through the
      // (fake) database, so the count is available from any call site.
      await expect(referralCodeExists('ABCDEFGH')).resolves.toBe(true);
      await expect(getReferralCount('ABCDEFGH')).resolves.toBe(1);
    });
  });
});
