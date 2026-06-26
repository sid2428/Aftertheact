-- Per-episode judge lineup. Judges stay in the Redis panel pool (reused by their
-- stable slug id, never recreated); this column records which of them are
-- allocated to each episode. Admin sets it on the episode manage page, and
-- /panel shows only the allocated judges for the selected episode.
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS judge_ids JSONB DEFAULT '[]';
