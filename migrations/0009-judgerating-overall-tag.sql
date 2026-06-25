-- Migration 9 — JudgeRating: switch from 3 sliders to one overall score + a behaviour tag.
-- Old harshness/accuracy/entertainment columns are left in place (unused) rather than
-- dropped, so existing rows aren't destroyed.
ALTER TABLE "JudgeRating" ADD COLUMN IF NOT EXISTS overall_score SMALLINT CHECK (overall_score BETWEEN 1 AND 10);
ALTER TABLE "JudgeRating" ADD COLUMN IF NOT EXISTS tag TEXT;
