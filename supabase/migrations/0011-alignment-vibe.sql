-- Change predicted_alignment from BOOLEAN to VARCHAR(20)
-- Since the table is empty (count = 0), we can just drop and recreate it cleanly.
ALTER TABLE "UserPrediction" DROP COLUMN IF EXISTS predicted_alignment;
ALTER TABLE "UserPrediction" ADD COLUMN predicted_alignment VARCHAR(20) CHECK (predicted_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));

-- The actual alignment can also be tracked to let users see what the actual vibe was.
ALTER TABLE "UserPrediction" DROP COLUMN IF EXISTS actual_alignment;
ALTER TABLE "UserPrediction" ADD COLUMN actual_alignment VARCHAR(20) CHECK (actual_alignment IN ('HARSH', 'ALIGNED', 'GENEROUS'));
