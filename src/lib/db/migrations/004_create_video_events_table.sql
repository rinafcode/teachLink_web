-- Migration: Create video_events table
-- Description: Stores video analytics events (play, pause, seek, etc.)

CREATE TABLE IF NOT EXISTS video_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  lesson_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups by user and lesson
CREATE INDEX IF NOT EXISTS idx_video_events_user_lesson ON video_events(user_id, lesson_id);

-- Index for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_video_events_created_at ON video_events(created_at DESC);

-- Index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_video_events_type ON video_events(event_type);
