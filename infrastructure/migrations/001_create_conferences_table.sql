-- Create conferences table for storing user conference records
-- This table stores professional conferences attended, spoken at, or organized by users

CREATE TABLE IF NOT EXISTS conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('speaker', 'attendee', 'organizer')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_conferences_user_id ON conferences(user_id);

-- Create index on date for sorting
CREATE INDEX IF NOT EXISTS idx_conferences_date ON conferences(date DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conferences_updated_at
  BEFORE UPDATE ON conferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE conferences IS 'Stores professional conference records for user profiles';
