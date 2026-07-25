-- Migration: Create notes table
-- Description: Stores video notes for users per lesson

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(255),
  lesson_id VARCHAR(255) NOT NULL,
  time_seconds DECIMAL(10,3) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups by user and lesson
CREATE INDEX IF NOT EXISTS idx_notes_user_lesson ON notes(user_id, lesson_id);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
