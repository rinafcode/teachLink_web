import { query } from '../pool';

/**
 * Referrals Repository
 * Handles CRUD operations for referral codes and referral attribution in
 * PostgreSQL. Replaces the previous in-memory `mockReferralCodes` Map.
 */

export interface ReferralRecord {
  code: string;
  ownerEmail: string;
  ownerId: string | null;
  referralCount: number;
  createdAt: string;
}

/**
 * Persists a new referral code for a user. A no-op if the code already
 * exists (codes are generated to be unique, but this keeps the operation
 * idempotent under retries).
 */
export async function create(
  code: string,
  ownerEmail: string,
  ownerId: string | null = null,
): Promise<void> {
  await query(
    `INSERT INTO referrals (code, owner_email, owner_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (code) DO NOTHING`,
    [code, ownerEmail, ownerId],
  );
}

export async function findByCode(code: string): Promise<ReferralRecord | null> {
  const result = await query(
    `SELECT code, owner_email, owner_id, referral_count, created_at
     FROM referrals
     WHERE code = $1`,
    [code],
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  return {
    code: row.code,
    ownerEmail: row.owner_email,
    ownerId: row.owner_id,
    referralCount: row.referral_count,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function exists(code: string): Promise<boolean> {
  const result = await query(`SELECT 1 FROM referrals WHERE code = $1`, [code]);
  return result.rows.length > 0;
}

export async function getOwnerEmail(code: string): Promise<string | undefined> {
  const result = await query(`SELECT owner_email FROM referrals WHERE code = $1`, [code]);
  return result.rows[0]?.owner_email ?? undefined;
}

/**
 * Records that `referredEmail` successfully signed up using `code`, and
 * increments the denormalized counter on `referrals`. Idempotent per
 * (code, referredEmail) pair via the unique constraint on `referred_users` —
 * a duplicate signup attempt does not double-count.
 */
export async function recordReferral(
  code: string,
  referredEmail: string,
  referredUserId: string | null = null,
): Promise<void> {
  const inserted = await query(
    `INSERT INTO referred_users (referral_code, referred_email, referred_user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (referral_code, referred_email) DO NOTHING
     RETURNING id`,
    [code, referredEmail, referredUserId],
  );

  if (inserted.rows.length > 0) {
    await query(`UPDATE referrals SET referral_count = referral_count + 1 WHERE code = $1`, [code]);
  }
}

/**
 * Source of truth for a code's referral count — counted directly from
 * `referred_users` rather than trusting the denormalized column alone.
 */
export async function getReferralCount(code: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM referred_users WHERE referral_code = $1`,
    [code],
  );
  return result.rows[0]?.count ?? 0;
}
