-- Migration 4 — CommunityPost table (The Green Room feed)
CREATE TABLE IF NOT EXISTS "CommunityPost" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 280),
  contestant_tag UUID REFERENCES "Contestant"(id) ON DELETE SET NULL,
  episode_tag UUID REFERENCES "Episode"(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'VISIBLE' CHECK (moderation_status IN ('VISIBLE', 'REMOVED', 'HELD')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_communitypost_created ON "CommunityPost"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communitypost_user ON "CommunityPost"(user_id);
CREATE INDEX IF NOT EXISTS idx_communitypost_likes ON "CommunityPost"(like_count DESC);

-- RLS: public can read visible posts; writes go through the service role
-- (the Next.js server) which bypasses RLS, so app behaviour is unaffected.
ALTER TABLE "CommunityPost" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "communitypost_select_visible" ON "CommunityPost";
CREATE POLICY "communitypost_select_visible" ON "CommunityPost"
  FOR SELECT USING (moderation_status = 'VISIBLE');
