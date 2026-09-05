-- Migration: Create rate_limits table
-- Description: Persists rate-limit counters across process restarts so that
--              in-memory counters no longer reset on every deploy.

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier VARCHAR(512) PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleaning up expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);
