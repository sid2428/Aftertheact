-- Root cause of "no predictions / no latent points": migration 0011 (which
-- converts predicted_alignment from BOOLEAN to VARCHAR) was never applied to
-- the live DB, so prediction inserts of 'HARSH'/'ALIGNED'/'GENEROUS' fail with
-- "invalid input syntax for type boolean". UserPrediction is empty, so a clean
-- drop/re-add is safe.
ALTER TABLE "UserPrediction" DROP COLUMN IF EXISTS predicted_alignment;
ALTER TABLE "UserPrediction"
    ADD COLUMN predicted_alignment VARCHAR(20)
    CHECK (predicted_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));
