-- Migration 6 — CommunityPostReply table
CREATE TABLE IF NOT EXISTS "CommunityPostReply" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reply_post ON "CommunityPostReply"(post_id);

ALTER TABLE "CommunityPostReply" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reply_select_public" ON "CommunityPostReply";
CREATE POLICY "reply_select_public" ON "CommunityPostReply" FOR SELECT USING (true);
