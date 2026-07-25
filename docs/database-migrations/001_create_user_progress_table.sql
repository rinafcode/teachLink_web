-- Migration: Create user_progress table for course completion tracking
-- This table tracks individual user progress per course, enabling certificate generation validation

CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons TEXT[] DEFAULT '{}',
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_progress ON user_progress(progress);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_progress IS 'Tracks user progress for individual courses, used for certificate generation validation';
COMMENT ON COLUMN user_progress.progress IS 'Overall course progress percentage (0-100)';
COMMENT ON COLUMN user_progress.completed_lessons IS 'Array of lesson IDs that have been completed';
COMMENT ON COLUMN user_progress.completed_at IS 'Timestamp when the course was completed (progress reached 100%)';
