-- ============================================================================
-- 0028 — Karma starts at 1000 (a universal floor, for everyone).
--
-- WHY
-- The season standing ("karma") is latent_points_season = SUM(LatentPointsLedger).
-- A brand-new user shows up at 0 and sits dead last forever — no sense of being
-- in the race. We give EVERY user (seeded, existing, and all future signups) a
-- 1000-point floor, so a fresh joiner lands mid-pack and climbs from there. The
-- seeded crowd's lead is only their *earned* points above 1000 (a few hundred),
-- so as real users vote/post they overtake the seed data naturally — it stops
-- mattering once enough real activity piles on.
--
-- HOW
-- The floor is a normal ledger row (action_type='baseline', episode_id=NULL,
-- points=1000). Because every total is SUM(ledger), every existing re-sum (reveal
-- RPC, karma backfill) preserves it automatically — no RPC edits needed. New
-- signups get the row from the auth route, and the column DEFAULT keeps their
-- displayed score at 1000 until their first reveal re-sum.
--
-- FULLY IDEMPOTENT. Run once in the Supabase SQL editor. Safe to re-run.
-- ============================================================================

-- New users display 1000 immediately (before any ledger re-sum touches them).
ALTER TABLE "User" ALTER COLUMN latent_points_season  SET DEFAULT 1000;
ALTER TABLE "User" ALTER COLUMN latent_points_alltime SET DEFAULT 1000;

-- The baseline row is episode-less; it needs the same partial unique index the
-- live-karma row uses to be ON CONFLICT-able. (Created by 0021/0026 — repeated
-- here so 0028 stands alone on a drifted DB.)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_global_karma
  ON "LatentPointsLedger" (user_id, action_type)
  WHERE episode_id IS NULL;

-- One 1000-point baseline ledger row per existing user.
INSERT INTO "LatentPointsLedger" (user_id, episode_id, action_type, points)
SELECT id, NULL, 'baseline', 1000 FROM "User"
ON CONFLICT (user_id, action_type) WHERE episode_id IS NULL
DO UPDATE SET points = 1000;

-- Re-sum totals from the ledger (now including the baseline) and re-rank.
UPDATE "User" u SET
  latent_points_season  = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0),
  latent_points_alltime = COALESCE((SELECT SUM(points) FROM "LatentPointsLedger" WHERE user_id = u.id), 0)
WHERE u.id IS NOT NULL;

WITH Ranks AS (
  SELECT id,
    DENSE_RANK() OVER (ORDER BY latent_points_season  DESC) AS s_rank,
    DENSE_RANK() OVER (ORDER BY latent_points_alltime DESC) AS a_rank
  FROM "User"
)
UPDATE "User" u SET season_rank = r.s_rank, alltime_rank = r.a_rank
FROM Ranks r WHERE u.id = r.id;
