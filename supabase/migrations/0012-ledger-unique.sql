-- Ensure idempotency for scoring
ALTER TABLE "LatentPointsLedger" ADD CONSTRAINT unique_ledger_action UNIQUE (user_id, episode_id, action_type);
