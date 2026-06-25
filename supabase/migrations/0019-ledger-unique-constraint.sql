-- The reveal RPC does `INSERT INTO "LatentPointsLedger" ... ON CONFLICT
-- (user_id, episode_id, action_type) DO NOTHING`, which requires a matching
-- UNIQUE constraint. Migration 0012 adds it but was never applied to the live
-- DB, so the reveal fails with "no unique or exclusion constraint matching the
-- ON CONFLICT specification". Guarded so it is safe to run if already present.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_ledger_action'
    ) THEN
        ALTER TABLE "LatentPointsLedger"
            ADD CONSTRAINT unique_ledger_action UNIQUE (user_id, episode_id, action_type);
    END IF;
END $$;
