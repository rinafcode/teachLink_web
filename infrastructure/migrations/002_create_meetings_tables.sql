-- Create meetings table for storing video conference meeting records
-- This table stores video conference meetings with recording state

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(255) NOT NULL UNIQUE,
  host_id VARCHAR(255) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recording', 'ended')),
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on room_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON meetings(room_id);

-- Create index on host_id for user's meetings
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);

-- Create index on status for filtering active meetings
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Create meeting_participants table for storing meeting participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Create index on meeting_id for participant lookups
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- Create index on user_id for user's meeting history
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON meeting_participants(user_id);

-- Add trigger to update updated_at timestamp on meetings
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables
COMMENT ON TABLE meetings IS 'Stores video conference meeting records with recording state';
COMMENT ON TABLE meeting_participants IS 'Stores participants for video conference meetings';
