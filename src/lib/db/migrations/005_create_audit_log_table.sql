-- Migration: Create audit_log table
-- Description: Durable storage for audit trail entries (see src/lib/audit).
-- Compliance requires audit entries to survive server restarts instead of
-- living only in a capped in-memory array.

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(64) PRIMARY KEY,
  actor_id VARCHAR(255) NOT NULL,
  action VARCHAR(32) NOT NULL,
  target_type VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  path VARCHAR(1024) NOT NULL,
  method VARCHAR(16) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  user_agent TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  metadata JSONB,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary access pattern for the admin audit UI: newest first
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log("timestamp" DESC);

-- Support filtering by actor, target type, and action (admin queries)
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_type ON audit_log(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
