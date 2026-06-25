-- Fix: admin page error "Could not find a relationship between 'CommunityPost'
-- and 'PostReport' in the schema cache". The PostReport table is defined in
-- schema.sql but was never created in the live DB.
CREATE TABLE IF NOT EXISTS "PostReport" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (post_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_postreport_post ON "PostReport"(post_id);
ALTER TABLE "PostReport" ENABLE ROW LEVEL SECURITY;
