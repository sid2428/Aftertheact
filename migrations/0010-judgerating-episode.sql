-- Migration 10 — JudgeRating: rate judges per episode instead of one cumulative rating.
-- Existing rows keep episode_id NULL (untouched); NULL is excluded from the unique
-- constraint match, so they don't collide with new per-episode rows.
ALTER TABLE "JudgeRating" ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES "Episode"(id);
CREATE INDEX IF NOT EXISTS idx_judgerating_episode_id ON "JudgeRating"(episode_id);

ALTER TABLE "JudgeRating" DROP CONSTRAINT IF EXISTS "JudgeRating_judge_id_user_id_key";
ALTER TABLE "JudgeRating" ADD CONSTRAINT judgerating_judge_user_episode_key UNIQUE (judge_id, user_id, episode_id);
