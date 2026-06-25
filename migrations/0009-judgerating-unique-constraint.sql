-- Migration 9 — guarantee the UNIQUE (judge_id, user_id) constraint the rating
-- upsert needs. The app rates a judge globally (the /rate route has no episode
-- context), so the conflict target is exactly (judge_id, user_id). An
-- episode-scoped variant does NOT work here: episode_id is always NULL, and
-- NULLs are distinct in a unique constraint, so duplicates wouldn't be caught.

-- 1) Drop any episode-scoped variant that doesn't match the upsert.
ALTER TABLE "JudgeRating" DROP CONSTRAINT IF EXISTS judgerating_judge_user_episode_key;

-- 2) Collapse duplicate (judge_id, user_id) rows, keeping one per pair.
--    ctid is a stable physical row id, so this works even when timestamps tie.
DELETE FROM "JudgeRating" a
USING "JudgeRating" b
WHERE a.ctid < b.ctid
  AND a.judge_id = b.judge_id
  AND a.user_id = b.user_id;

-- 3) (Re)create exactly the two-column unique constraint.
ALTER TABLE "JudgeRating" DROP CONSTRAINT IF EXISTS "JudgeRating_judge_id_user_id_key";
ALTER TABLE "JudgeRating" ADD CONSTRAINT "JudgeRating_judge_id_user_id_key" UNIQUE (judge_id, user_id);
