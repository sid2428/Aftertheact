-- Migration 5 — CommunityPostLike table
CREATE TABLE IF NOT EXISTS "CommunityPostLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_postlike_post ON "CommunityPostLike"(post_id);

ALTER TABLE "CommunityPostLike" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "postlike_select_public" ON "CommunityPostLike";
CREATE POLICY "postlike_select_public" ON "CommunityPostLike" FOR SELECT USING (true);
