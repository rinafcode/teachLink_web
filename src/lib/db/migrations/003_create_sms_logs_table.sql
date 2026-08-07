-- Migration: Create sms_logs table
-- Description: Stores SMS delivery logs for persistent tracking and analytics
-- Author: System
-- Date: 2026-06-30

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  level VARCHAR(50) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  scope VARCHAR(255) NOT NULL,
  request_id VARCHAR(255),
  
  -- SMS-specific context fields
  job_id VARCHAR(255),
  provider VARCHAR(100),
  phone_number VARCHAR(50),
  message_id VARCHAR(255),
  attempt INTEGER DEFAULT 1,
  status VARCHAR(50),
  event_type VARCHAR(100),
  recipient_count INTEGER,
  queue_length INTEGER,
  
  -- JSON fields for flexible data
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  error JSONB,
  metrics JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sms_logs_timestamp ON sms_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_level ON sms_logs(level);
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider ON sms_logs(provider);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_event_type ON sms_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_request_id ON sms_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_job_id ON sms_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_message_id ON sms_logs(message_id);

-- Composite indexes for common query combinations
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_timestamp ON sms_logs(provider, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status_timestamp ON sms_logs(status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_event_type_timestamp ON sms_logs(event_type, timestamp DESC);

-- GIN index for JSONB fields to support flexible querying
CREATE INDEX IF NOT EXISTS idx_sms_logs_context ON sms_logs USING GIN(context);
CREATE INDEX IF NOT EXISTS idx_sms_logs_metrics ON sms_logs USING GIN(metrics);

-- Add table comment
COMMENT ON TABLE sms_logs IS 'Persistent storage for SMS delivery logs, metrics, and troubleshooting data';

-- Add column comments
COMMENT ON COLUMN sms_logs.id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN sms_logs.timestamp IS 'When the SMS event occurred';
COMMENT ON COLUMN sms_logs.level IS 'Log severity level (debug, info, warn, error)';
COMMENT ON COLUMN sms_logs.provider IS 'SMS provider used (e.g., twilio, sns)';
COMMENT ON COLUMN sms_logs.status IS 'SMS delivery status (sent, failed, retrying, etc.)';
COMMENT ON COLUMN sms_logs.event_type IS 'Type of SMS event (enrollment, reminder, etc.)';
COMMENT ON COLUMN sms_logs.context IS 'Additional context data as JSON';
COMMENT ON COLUMN sms_logs.error IS 'Error details if the SMS delivery failed';
COMMENT ON COLUMN sms_logs.metrics IS 'Performance metrics (delivery time, etc.)';
