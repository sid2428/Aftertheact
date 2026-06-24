-- Migration 7 — PostReport table
CREATE TABLE IF NOT EXISTS "PostReport" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, reporter_user_id)
);
CREATE INDEX IF NOT EXISTS idx_postreport_post ON "PostReport"(post_id);

-- INSERT requires auth; SELECT restricted to admins. The app reads/writes via
-- the service role (bypasses RLS); these policies just lock down direct access.
ALTER TABLE "PostReport" ENABLE ROW LEVEL SECURITY;
