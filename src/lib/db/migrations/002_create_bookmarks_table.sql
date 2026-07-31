-- Migration: Create bookmarks table
-- Description: Stores video bookmarks for users per lesson

CREATE TABLE IF NOT EXISTS bookmarks (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(255),
  lesson_id VARCHAR(255) NOT NULL,
  time_seconds DECIMAL(10,3) NOT NULL,
  title VARCHAR(255) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups by user and lesson
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_lesson ON bookmarks(user_id, lesson_id);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
