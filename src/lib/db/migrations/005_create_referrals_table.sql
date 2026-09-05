-- Migration: Create referrals and referred_users tables
-- Description: Persists referral codes and successful referral signups.
-- Replaces the previous in-memory `mockReferralCodes` Map (src/lib/referral.ts),
-- which lost all referral codes on every server restart.

CREATE TABLE IF NOT EXISTS referrals (
  code TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  owner_id UUID,
  referral_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_owner_email ON referrals (owner_email);

-- One row per successful signup attributed to a referral code. This is the
-- source of truth for `getReferralCount` (via SELECT COUNT(*)); the
-- `referral_count` column on `referrals` is a denormalized cache kept in
-- sync alongside it for O(1) reads.
CREATE TABLE IF NOT EXISTS referred_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL REFERENCES referrals(code) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referral_code, referred_email)
);

CREATE INDEX IF NOT EXISTS idx_referred_users_referral_code ON referred_users (referral_code);
