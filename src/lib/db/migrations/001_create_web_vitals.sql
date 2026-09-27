CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  rating VARCHAR(20) NOT NULL,
  page_url TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_name ON web_vitals (name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_url ON web_vitals (page_url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals (created_at);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals (rating);
