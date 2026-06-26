-- ============================================================================
-- 0026 — Consolidated live-schema sync + optimization.
--
-- WHY THIS EXISTS
-- A read-only audit of the live DB (2026-06-26) found it had drifted from the
-- repo: several tables, a column, and ALL of the atomic-counter / karma RPCs
-- (migrations 0021, 0022, 0025) were never applied. As a result, in production:
--   • liking a post           → 500 (adjust_post_likes / adjust_user_karma missing)
--   • upvoting a roast         → 500 (increment_roast_upvotes / adjust_user_karma missing)
--   • replying to a post       → 500 (CommunityPostReply table + bump_post_replies missing)
--   • reporting a post         → 500 (PostReport table + CommunityPost.report_count missing)
--   • admin community moderation page → error (PostReport relationship missing)
--
-- This file is FULLY IDEMPOTENT and SELF-CONTAINED. Run it ONCE in the Supabase
-- SQL editor. It is safe even if some pieces were already applied — every
-- statement guards with IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT. It
-- supersedes running 0021, 0022, and 0025 individually.
--
-- It contains NO destructive statements except a one-time idempotent karma
-- backfill (re-derivable) and a state reconcile on a single stuck episode.
-- ============================================================================

-- ── 1. Missing tables ───────────────────────────────────────────────────────

-- CommunityPostReply (was migrations/0006, never applied to live)
CREATE TABLE IF NOT EXISTS "CommunityPostReply" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reply_post ON "CommunityPostReply"(post_id);
ALTER TABLE "CommunityPostReply" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reply_select_public" ON "CommunityPostReply";
CREATE POLICY "reply_select_public" ON "CommunityPostReply" FOR SELECT USING (true);

-- PostReport (was migrations/0007 + supabase 0016/0020, never applied to live)
CREATE TABLE IF NOT EXISTS "PostReport" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, reporter_user_id)
);
CREATE INDEX IF NOT EXISTS idx_postreport_post ON "PostReport"(post_id);
ALTER TABLE "PostReport" ENABLE ROW LEVEL SECURITY;

-- ── 2. Missing column ───────────────────────────────────────────────────────
-- The report route bumps CommunityPost.report_count; the live table lacks it.
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- ── 3. Karma: partial unique index + incremental adjust RPC (0021 + 0022) ────

-- One global karma row per user (episode_id IS NULL). NULLs are "distinct" under
-- the table UNIQUE(user_id, episode_id, action_type), so the live-karma upsert
-- needs this partial unique index to be ON CONFLICT-able.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_global_karma
  ON "LatentPointsLedger" (user_id, action_type)
  WHERE episode_id IS NULL;

-- O(1) karma adjust: one indexed ledger upsert + one indexed User update, kept in
-- lockstep so totals never drift; the reveal re-sum self-heals any gap.
CREATE OR REPLACE FUNCTION adjust_user_karma(p_user_id UUID, p_delta INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
    VALUES (p_user_id, NULL, 'post_karma', p_delta)
    ON CONFLICT (user_id, action_type) WHERE episode_id IS NULL
    DO UPDATE SET points = "LatentPointsLedger".points + p_delta;

    UPDATE "User" SET
        latent_points_season  = latent_points_season  + p_delta,
        latent_points_alltime = latent_points_alltime + p_delta
    WHERE id = p_user_id;
END;
$$;

-- recompute_user_karma was superseded by adjust_user_karma; drop if present.
DROP FUNCTION IF EXISTS recompute_user_karma(UUID);

-- ── 4. Atomic counter RPCs (0025) ───────────────────────────────────────────
-- Replace SELECT-count → +1 → UPDATE read-modify-write races with single
-- indexed UPDATEs that return the new value.

CREATE OR REPLACE FUNCTION adjust_post_likes(p_post_id UUID, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE "CommunityPost"
       SET like_count = GREATEST(0, like_count + p_delta)
     WHERE id = p_post_id
     RETURNING like_count INTO v_count;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION bump_post_replies(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "CommunityPost"
       SET reply_count = reply_count + 1
     WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_roast_upvotes(p_roast_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE v_user UUID;
BEGIN
    UPDATE "Roast"
       SET upvote_count = upvote_count + 1
     WHERE id = p_roast_id
     RETURNING user_id INTO v_user;
    RETURN v_user;
END;
$$;

-- ── 5. Hot-path indexes (0025) ──────────────────────────────────────────────
-- The base schema's composite UNIQUEs only index their LEADING column, so the
-- pervasive `WHERE episode_id = ?` filters (flush, reveal, scoring, reads) were
-- uncovered. Tables are tiny today, so plain CREATE INDEX locks for microseconds.
-- On a large live table, run these one at a time with CONCURRENTLY (outside a txn).

CREATE INDEX IF NOT EXISTS idx_cea_episode
  ON "ContestantEpisodeAppearance"(episode_id);
CREATE INDEX IF NOT EXISTS idx_uservote_episode_contestant
  ON "UserVote"(episode_id, contestant_id);
CREATE INDEX IF NOT EXISTS idx_userprediction_episode
  ON "UserPrediction"(episode_id);
CREATE INDEX IF NOT EXISTS idx_roast_user
  ON "Roast"(user_id);
CREATE INDEX IF NOT EXISTS idx_roast_held
  ON "Roast"(created_at) WHERE moderation_status = 'HELD';
CREATE INDEX IF NOT EXISTS idx_user_lp_season
  ON "User"(latent_points_season DESC);
CREATE INDEX IF NOT EXISTS idx_user_oracle
  ON "User"(oracle_score DESC) WHERE oracle_qualifying_episodes >= 1;

-- ── 6. One-time karma backfill (idempotent) ─────────────────────────────────
-- Seed/refresh each user's single global karma row from current like/upvote
-- counts, then re-sum totals. Safe to re-run (ON CONFLICT overwrites with the
-- recomputed absolute value). Skipped rows: users with zero karma.
DELETE FROM "LatentPointsLedger" WHERE action_type = 'post_karma' AND episode_id IS NOT NULL;

INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
SELECT u.id, NULL, 'post_karma',
       COALESCE((SELECT SUM(like_count)   FROM "CommunityPost" WHERE user_id = u.id), 0)
     + COALESCE((SELECT SUM(upvote_count) FROM "Roast"         WHERE user_id = u.id), 0)
FROM "User" u
WHERE COALESCE((SELECT SUM(like_count)   FROM "CommunityPost" WHERE user_id = u.id), 0)
    + COALESCE((SELECT SUM(upvote_count) FROM "Roast"         WHERE user_id = u.id), 0) > 0
ON CONFLICT (user_id, action_type) WHERE episode_id IS NULL
DO UPDATE SET points = EXCLUDED.points;

UPDATE "User" u SET
    latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
    latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
WHERE u.id IS NOT NULL;

-- ── 7. Reconcile stuck episode state ────────────────────────────────────────
-- The audit found an episode with status='LIVE' AND is_revelation_triggered=true
-- (window already closed). The reveal RPC early-returns once triggered, so it can
-- never flip to REVEALED on its own. Settle it. (The code guard in flush-votes
-- prevents this combination from recurring.)
UPDATE "Episode"
   SET status = 'REVEALED'
 WHERE is_revelation_triggered = true
   AND status = 'LIVE'
   AND voting_window_close IS NOT NULL
   AND voting_window_close <= NOW();

-- ── Done. Verify in the SQL editor:
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('adjust_user_karma','adjust_post_likes','bump_post_replies','increment_roast_upvotes');
--   SELECT to_regclass('public."CommunityPostReply"'), to_regclass('public."PostReport"');
-- ============================================================================
