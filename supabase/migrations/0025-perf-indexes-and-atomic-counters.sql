-- Performance pass for ~10k users: hot-path indexes + atomic counter RPCs.
--
-- Context: the base schema shipped with almost no secondary indexes, and the
-- composite UNIQUE constraints only index their LEADING column — so lookups by
-- episode_id (which lead with user_id / contestant_id) fall back to seq scans.
-- Every reveal RPC, vote flush, and episode read filters by episode_id.
--
-- NOTE: on an already-large live table, apply each CREATE INDEX with CONCURRENTLY
-- (outside a txn) to avoid a write lock. Plain form is fine pre-scale.

-- ── Indexes ────────────────────────────────────────────────────────────────

-- Every reveal RPC, flush, and episode read filters appearances by episode_id;
-- the UNIQUE(contestant_id, episode_id) leads with contestant_id, so this is uncovered.
CREATE INDEX IF NOT EXISTS idx_cea_episode
  ON "ContestantEpisodeAppearance"(episode_id);

-- flush-votes + award scan votes by episode_id (UNIQUE leads with user_id);
-- the composite also serves the per-contestant aggregation in the flush.
CREATE INDEX IF NOT EXISTS idx_uservote_episode_contestant
  ON "UserVote"(episode_id, contestant_id);

-- score_episode_predictions filters/updates predictions by episode_id
-- (UNIQUE(user_id, episode_id) leads with user_id).
CREATE INDEX IF NOT EXISTS idx_userprediction_episode
  ON "UserPrediction"(episode_id);

-- Roast has zero indexes; admin user-detail page + karma sums filter by user_id.
CREATE INDEX IF NOT EXISTS idx_roast_user
  ON "Roast"(user_id);

-- Admin moderation queue only ever reads the small HELD slice — partial keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_roast_held
  ON "Roast"(created_at) WHERE moderation_status = 'HELD';

-- Leaderboard top-50 sorts (run on every leaderboard hit).
CREATE INDEX IF NOT EXISTS idx_user_lp_season
  ON "User"(latent_points_season DESC);
CREATE INDEX IF NOT EXISTS idx_user_oracle
  ON "User"(oracle_score DESC) WHERE oracle_qualifying_episodes >= 1;

-- Deliberately omitted (already covered by a composite-UNIQUE leading column or
-- no query filters on them): LatentPointsLedger(user_id), Roast(episode_id),
-- Roast(contestant_id), UserVote(episode_id) alone.

-- ── Atomic counter RPCs ──────────────────────────────────────────────────────
-- Replaces SELECT-count → +1 → UPDATE read-modify-write races (lost updates under
-- concurrency) with a single indexed UPDATE. Mirrors adjust_user_karma (0022).

-- Like toggle: shift the denormalized counter and return the new value (clamped ≥0).
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

-- Reply added: bump the denormalized counter atomically.
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

-- Roast upvote: increment atomically and return the author id (for the karma bump),
-- so the caller needs no separate read.
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
