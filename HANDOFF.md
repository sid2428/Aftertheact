# Handoff — 2026-06-26
last_commit: 578f4f0
branch: main

## Done
- Live global post-karma. Likes (`api/community/posts/[id]/like/route.js`) and
  roast upvotes (`actions/roasts.js`) call `adjust_user_karma(user_id, ±1)` —
  O(1), updates author's latent_points instantly. Migrations `0021` (global
  model + one-time backfill) and `0022` (incremental ±1, drops the old
  recompute fn). RUN BOTH in Supabase if not already.
- `award_episode_latent_points` (in 0021) no longer awards per-episode
  post_karma — karma is global now, so reveal + live would otherwise double-count.
- Relabel "Latent Score" → "Crowd Score" tile (`SplitFlapScoreboard.js`,
  `admin/episodes/[id]/page.js`).

## In progress
- None. All shipped.

## Next action
- In Supabase: confirm `0021`+`0022` ran. Then upvote a roast and check that
  author's `latent_points_season` jumps (leaderboard reflects within 30s).

## Decisions (with reasoning)
- Karma is GLOBAL (one ledger row per user, `episode_id IS NULL`, enforced by
  partial unique index `uniq_global_karma`), not per-episode — user chose
  reddit-style over matching the old per-episode keying.
- Increment by ±1 instead of re-summing all posts/roasts per click — avoids
  O(n) scans. ledger + User move together; reveal's SUM(ledger) self-heals drift.
- "Pseudo-live": author's point TOTAL updates instantly; rank ORDER settles via
  leaderboard `revalidate=30` + next reveal (skipped O(users) re-rank per click).

## Do not touch
- `score_episode_predictions` (in 0017) — non-idempotent counter increments;
  known footgun, untouched this session. Don't toggle `is_revelation_triggered`
  manually (caused a prior stuck-status bug).

## Blockers
- None.
