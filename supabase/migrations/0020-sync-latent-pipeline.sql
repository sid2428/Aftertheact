-- ============================================================================
-- Consolidated schema-sync for the latent-points / Oracle pipeline.
-- Idempotent and safe to run even if individual earlier migrations were applied.
-- Brings a drifted live DB fully in line with schema.sql so that real users'
-- predictions are saved AND scored (latent points + Oracle / Prophet's Wall).
-- ============================================================================

-- 1. Missing table: PostReport (admin "reported posts") --------------------
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

-- 2. Missing column: Episode.thumbnail_url ---------------------------------
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 3. Prediction columns must be VARCHAR, not the legacy BOOLEAN -------------
--    (UserPrediction is keyed by (user_id, episode_id); convert in place.)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'UserPrediction' AND column_name = 'predicted_alignment'
          AND data_type <> 'character varying'
    ) THEN
        ALTER TABLE "UserPrediction" DROP COLUMN predicted_alignment;
        ALTER TABLE "UserPrediction" ADD COLUMN predicted_alignment VARCHAR(20)
            CHECK (predicted_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));
    END IF;
END $$;

ALTER TABLE "UserPrediction" ADD COLUMN IF NOT EXISTS actual_alignment VARCHAR(20)
    CHECK (actual_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));

-- Scoring output columns the reveal RPC writes
ALTER TABLE "UserPrediction" ADD COLUMN IF NOT EXISTS top_correct BOOLEAN;
ALTER TABLE "UserPrediction" ADD COLUMN IF NOT EXISTS bottom_correct BOOLEAN;
ALTER TABLE "UserPrediction" ADD COLUMN IF NOT EXISTS alignment_correct BOOLEAN;
ALTER TABLE "UserPrediction" ADD COLUMN IF NOT EXISTS points_earned INTEGER;

-- 4. Verdict aggregate columns the flush writes / reveal reads --------------
ALTER TABLE "ContestantEpisodeAppearance" ADD COLUMN IF NOT EXISTS peoples_verdict_weighted FLOAT;
ALTER TABLE "ContestantEpisodeAppearance" ADD COLUMN IF NOT EXISTS total_votes_weighted FLOAT DEFAULT 0.0;

-- 5. User aggregate columns the reveal RPC updates -------------------------
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS latent_points_season INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS latent_points_alltime INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS season_rank INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS alltime_rank INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS oracle_score FLOAT DEFAULT 0.0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS oracle_qualifying_episodes INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]';

-- 6. Ledger uniqueness for the reveal RPC's ON CONFLICT --------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ledger_action') THEN
        ALTER TABLE "LatentPointsLedger"
            ADD CONSTRAINT unique_ledger_action UNIQUE (user_id, episode_id, action_type);
    END IF;
END $$;
