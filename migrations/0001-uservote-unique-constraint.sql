-- Migration 1 — UserVote unique constraint
-- Backs the section 5 voting fix: Redis blocks duplicate votes, but without a
-- DB-level constraint a user could vote twice if Redis state were ever lost.
-- This pairs with the upsert (onConflict: user_id,episode_id,contestant_id) in
-- src/app/actions/vote.js.
--
-- NOTE: if duplicate (user_id, episode_id, contestant_id) rows already exist,
-- this ALTER will fail. De-duplicate first (keep the most recent), e.g.:
--   DELETE FROM "UserVote" a USING "UserVote" b
--   WHERE a.ctid < b.ctid
--     AND a.user_id = b.user_id
--     AND a.episode_id = b.episode_id
--     AND a.contestant_id = b.contestant_id;

ALTER TABLE "UserVote"
  ADD CONSTRAINT "UserVote_user_episode_contestant_unique"
  UNIQUE (user_id, episode_id, contestant_id);
