-- Create polls table for storing user-created polls
-- This table stores polls that can be created via command palette and shared in real-time

CREATE TABLE IF NOT EXISTS polls (
  id VARCHAR(255) PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  course_id VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on course_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_polls_course_id ON polls(course_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- Add comment to table
COMMENT ON TABLE polls IS 'Stores polls created by users via command palette';
