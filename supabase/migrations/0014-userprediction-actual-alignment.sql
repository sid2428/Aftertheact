-- Fix: "Failed to reveal episode" — score_episode_predictions() writes to
-- UserPrediction.actual_alignment, but the column was never added to the live DB.
-- (It is present in schema.sql but the live table predates it.)
ALTER TABLE "UserPrediction"
    ADD COLUMN IF NOT EXISTS actual_alignment VARCHAR(20)
    CHECK (actual_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));
