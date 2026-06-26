-- Live, reddit-style post karma.
-- Karma is now GLOBAL (all likes on a user's posts + all upvotes on their roasts,
-- regardless of episode) and updates the instant a take gets popular, instead of
-- only at reveal. It lives in a single per-user ledger row (episode_id = NULL),
-- so latent_points_* (which is SUM(ledger)) ticks up immediately.

-- One global karma row per user. NULLs are "distinct" under the existing
-- UNIQUE(user_id, episode_id, action_type), so we need a partial index to make
-- the episode-less karma row unique and ON CONFLICT-able.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_global_karma
    ON "LatentPointsLedger" (user_id, action_type)
    WHERE episode_id IS NULL;

-- Recompute one user's global karma and re-sum their totals. Called live from
-- the upvote/like handlers. Cheap: touches only this user's row. Ranks are NOT
-- re-ranked here (that's O(users) per click) — they settle at the next reveal,
-- and /leaderboard already revalidates every 30s. ponytail: pseudo-live ranks.
CREATE OR REPLACE FUNCTION recompute_user_karma(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_karma INTEGER;
BEGIN
    SELECT COALESCE((SELECT SUM(like_count) FROM "CommunityPost" WHERE user_id = p_user_id), 0)
         + COALESCE((SELECT SUM(upvote_count) FROM "Roast" WHERE user_id = p_user_id), 0)
    INTO v_karma;

    INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
    VALUES (p_user_id, NULL, 'post_karma', v_karma)
    ON CONFLICT (user_id, action_type) WHERE episode_id IS NULL
    DO UPDATE SET points = EXCLUDED.points
    WHERE "LatentPointsLedger".points IS DISTINCT FROM EXCLUDED.points;

    UPDATE "User" u SET
        latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
        latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
    WHERE u.id = p_user_id;
END;
$$;

-- Reveal no longer awards post_karma — karma is global and maintained live now.
-- (Same body as 0017 minus the per-episode post_karma block, so the two never
-- double-count.) Vote-accuracy + totals + ranks unchanged.
CREATE OR REPLACE FUNCTION award_episode_latent_points(p_episode_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    v_accuracy INTEGER;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM "UserVote" WHERE episode_id = p_episode_id LOOP

        SELECT COALESCE(ROUND(SUM(GREATEST(0, 10 - 2 * ABS(uv.score - cea.peoples_verdict_weighted)))), 0)
        INTO v_accuracy
        FROM "UserVote" uv
        JOIN "ContestantEpisodeAppearance" cea
          ON cea.episode_id = uv.episode_id AND cea.contestant_id = uv.contestant_id
        WHERE uv.episode_id = p_episode_id AND uv.user_id = r.user_id
          AND cea.peoples_verdict_weighted IS NOT NULL;

        IF v_accuracy > 0 THEN
            INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
            VALUES (r.user_id, p_episode_id, 'vote_accuracy', v_accuracy)
            ON CONFLICT (user_id, episode_id, action_type) DO NOTHING;
        END IF;

    END LOOP;

    -- Ledger is the source of truth; recompute totals + ranks for everyone.
    UPDATE "User" u SET
        latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
        latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
    WHERE u.id IS NOT NULL;

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

-- One-time migration: drop the old per-episode karma rows, then seed one global
-- karma row per user from current counts, and re-sum everyone's totals + ranks.
DELETE FROM "LatentPointsLedger" WHERE action_type = 'post_karma' AND episode_id IS NOT NULL;

INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
SELECT u.id, NULL, 'post_karma',
       COALESCE((SELECT SUM(like_count) FROM "CommunityPost" WHERE user_id = u.id), 0)
     + COALESCE((SELECT SUM(upvote_count) FROM "Roast" WHERE user_id = u.id), 0)
FROM "User" u
WHERE COALESCE((SELECT SUM(like_count) FROM "CommunityPost" WHERE user_id = u.id), 0)
    + COALESCE((SELECT SUM(upvote_count) FROM "Roast" WHERE user_id = u.id), 0) > 0
ON CONFLICT (user_id, action_type) WHERE episode_id IS NULL
DO UPDATE SET points = EXCLUDED.points;

UPDATE "User" u SET
    latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
    latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
WHERE u.id IS NOT NULL;

WITH Ranks AS (
    SELECT id,
        DENSE_RANK() OVER (ORDER BY latent_points_season DESC) AS s_rank,
        DENSE_RANK() OVER (ORDER BY latent_points_alltime DESC) AS a_rank
    FROM "User"
)
UPDATE "User" u SET season_rank = rk.s_rank, alltime_rank = rk.a_rank
FROM Ranks rk WHERE u.id = rk.id;
