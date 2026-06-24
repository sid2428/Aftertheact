-- Migration 3 — JudgeRating table
-- judge_id is TEXT (not a FK) because judges are identified by the Redis
-- panel:members id/slug rather than a Judge table row. One cumulative rating
-- per (judge, user).
CREATE TABLE IF NOT EXISTS "JudgeRating" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id TEXT NOT NULL,
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  harshness_score SMALLINT CHECK (harshness_score BETWEEN 1 AND 10),
  accuracy_score SMALLINT CHECK (accuracy_score BETWEEN 1 AND 10),
  entertainment_score SMALLINT CHECK (entertainment_score BETWEEN 1 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (judge_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_judgerating_judge_id ON "JudgeRating"(judge_id);

ALTER TABLE "JudgeRating" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "judgerating_select_public" ON "JudgeRating";
CREATE POLICY "judgerating_select_public" ON "JudgeRating" FOR SELECT USING (true);
