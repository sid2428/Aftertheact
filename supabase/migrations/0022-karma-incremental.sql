-- Optimize live karma: increment by a delta instead of re-summing everything.
-- recompute_user_karma() scanned ALL of a user's posts + roosts on every like —
-- O(n) per click. Reddit doesn't recompute, it increments. adjust_user_karma()
-- is O(1): two indexed writes, no scans. ledger and User move by the same delta
-- so they stay in lockstep, and the reveal re-sum self-heals any drift.

CREATE OR REPLACE FUNCTION adjust_user_karma(p_user_id UUID, p_delta INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- New users have no karma row yet → insert; otherwise bump the global row.
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

DROP FUNCTION IF EXISTS recompute_user_karma(UUID);
