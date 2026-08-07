-- Migration: Create feature_flags table
-- Description: Stores feature flag configurations with support for different rollout strategies
-- Author: System
-- Date: 2026-06-28

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  strategy VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (strategy IN ('all', 'percentage', 'targeting')),
  percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT 'system'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_strategy ON feature_flags(strategy);
CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_at ON feature_flags(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tags ON feature_flags USING GIN(tags);

-- Seed initial feature flags
INSERT INTO feature_flags (id, name, description, enabled, strategy, percentage, rules, tags, created_by)
VALUES
  (
    'flag_new_dashboard',
    'New Dashboard',
    'Enables the redesigned learner dashboard.',
    false,
    'percentage',
    10,
    '[]'::jsonb,
    ARRAY['ui', 'dashboard'],
    'system'
  ),
  (
    'flag_ai_tutor',
    'AI Tutor',
    'Activates the AI-powered tutoring assistant.',
    false,
    'targeting',
    0,
    '[{"attribute": "plan", "operator": "equals", "value": "pro"}]'::jsonb,
    ARRAY['ai', 'beta'],
    'system'
  ),
  (
    'flag_video_speed',
    'Video Speed Controls',
    'Shows advanced playback speed options (0.5×–3×) in the video player.',
    true,
    'all',
    100,
    '[]'::jsonb,
    ARRAY['video', 'ux'],
    'system'
  )
ON CONFLICT (id) DO NOTHING;

-- Create audit log table for feature flag changes
CREATE TABLE IF NOT EXISTS feature_flags_audit (
  id VARCHAR(255) PRIMARY KEY,
  flag_id VARCHAR(255) NOT NULL,
  flag_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'toggled')),
  actor VARCHAR(255) NOT NULL,
  before JSONB,
  after JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_flag_id ON feature_flags_audit(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_timestamp ON feature_flags_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_audit_actor ON feature_flags_audit(actor);

-- Add comment to table
COMMENT ON TABLE feature_flags IS 'Feature flag configurations for progressive feature rollout';
COMMENT ON TABLE feature_flags_audit IS 'Audit log for feature flag changes';
