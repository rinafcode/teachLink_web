CREATE TABLE IF NOT EXISTS content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('COURSE', 'POST')),
  title VARCHAR(200) NOT NULL,
  submitted_by VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_note VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_content_approvals_status ON content_approvals (status);
CREATE INDEX IF NOT EXISTS idx_content_approvals_submitted_by ON content_approvals (submitted_by);
CREATE INDEX IF NOT EXISTS idx_content_approvals_submitted_at ON content_approvals (submitted_at);
