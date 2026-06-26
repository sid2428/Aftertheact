-- Judges are rated once per (judge, user, EPISODE): a judge recurring across
-- episodes is rated once in each. Restore the per-episode unique key and drop
-- the global (judge_id, user_id) key so the same user can rate the same judge
-- again in a different episode.
--
-- Final judge score is computed in app code as a trust-weighted mean over ALL
-- of a judge's ratings (every episode) — no schema change needed for that; it
-- just joins User.trust_score at read time.

ALTER TABLE "JudgeRating" ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES "Episode"(id);

-- Drop the global per-(judge,user) key from the earlier global model, if present.
ALTER TABLE "JudgeRating" DROP CONSTRAINT IF EXISTS "JudgeRating_judge_id_user_id_key";

-- Collapse any duplicate (judge, user, episode) rows before adding the unique key.
-- IS NOT DISTINCT FROM so NULL episodes also de-dupe. ctid is a stable row id.
DELETE FROM "JudgeRating" a
USING "JudgeRating" b
WHERE a.ctid < b.ctid
  AND a.judge_id = b.judge_id
  AND a.user_id = b.user_id
  AND a.episode_id IS NOT DISTINCT FROM b.episode_id;

ALTER TABLE "JudgeRating" DROP CONSTRAINT IF EXISTS judgerating_judge_user_episode_key;
ALTER TABLE "JudgeRating" ADD CONSTRAINT judgerating_judge_user_episode_key UNIQUE (judge_id, user_id, episode_id);

CREATE INDEX IF NOT EXISTS idx_judgerating_episode_id ON "JudgeRating"(episode_id);
