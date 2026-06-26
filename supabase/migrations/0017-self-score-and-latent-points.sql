-- Metrics model: each ContestantEpisodeAppearance now carries three scores —
--   self_score              : what the contestant gave themselves (admin-entered)
--   judge_average           : panel average (admin-entered)
--   peoples_verdict_weighted : the crowd verdict (computed from votes)  ← latent_score mirrors this at reveal
ALTER TABLE "ContestantEpisodeAppearance"
    ADD COLUMN IF NOT EXISTS self_score FLOAT;

-- Latent Points (user karma) are earned two ways, totalled at reveal:
--   1. vote accuracy : the closer a user's 1–10 vote is to the final crowd
--                       verdict, the more points (10 for an exact call per
--                       contestant, sliding to 0 at a 5-point miss).
--   2. post karma    : 1 point per like on their community posts + per upvote on
--                       their roasts tied to the episode.
-- Latent points are then recomputed as the SUM of the user's whole ledger, so
-- the function is fully idempotent (re-running a reveal never double-counts) and
-- self-correcting against the older prediction-based awards already in the ledger.
CREATE OR REPLACE FUNCTION award_episode_latent_points(p_episode_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    v_accuracy INTEGER;
    v_karma INTEGER;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM "UserVote" WHERE episode_id = p_episode_id LOOP

        SELECT COALESCE(ROUND(SUM(GREATEST(0, 10 - 2 * ABS(uv.score - cea.peoples_verdict_weighted)))), 0)
        INTO v_accuracy
        FROM "UserVote" uv
        JOIN "ContestantEpisodeAppearance" cea
          ON cea.episode_id = uv.episode_id AND cea.contestant_id = uv.contestant_id
        WHERE uv.episode_id = p_episode_id AND uv.user_id = r.user_id
          AND cea.peoples_verdict_weighted IS NOT NULL;

        SELECT COALESCE(SUM(like_count), 0) INTO v_karma
        FROM "CommunityPost" WHERE user_id = r.user_id AND episode_tag = p_episode_id;

        v_karma := v_karma + COALESCE((
            SELECT SUM(upvote_count) FROM "Roast"
            WHERE user_id = r.user_id AND episode_id = p_episode_id
        ), 0);

        IF v_accuracy > 0 THEN
            INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
            VALUES (r.user_id, p_episode_id, 'vote_accuracy', v_accuracy)
            ON CONFLICT (user_id, episode_id, action_type) DO NOTHING;
        END IF;

        IF v_karma > 0 THEN
            INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
            VALUES (r.user_id, p_episode_id, 'post_karma', v_karma)
            ON CONFLICT (user_id, episode_id, action_type) DO NOTHING;
        END IF;

    END LOOP;

    -- Ledger is the source of truth; recompute totals + ranks for everyone.
    -- WHERE clause satisfies pg-safeupdate.
    UPDATE "User" u SET
        latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
        latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
    WHERE u.id IS NOT NULL;

    -- Alias the CTE as `rk`, not `r`: `r` is the loop RECORD above (only has
    -- user_id), and PL/pgSQL would resolve `r.id`/`r.s_rank` to it, not the CTE.
    WITH Ranks AS (
        SELECT id,
            DENSE_RANK() OVER (ORDER BY latent_points_season DESC) AS s_rank,
            DENSE_RANK() OVER (ORDER BY latent_points_alltime DESC) AS a_rank
        FROM "User"
    )
    UPDATE "User" u SET season_rank = rk.s_rank, alltime_rank = rk.a_rank
    FROM Ranks rk WHERE u.id = rk.id;
END;
$$;
