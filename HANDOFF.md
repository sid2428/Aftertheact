# Handoff — 2026-06-26
last_commit: HEAD
branch: main

## Done (this session, on top of 578f4f0)
- **Judge the Judges fully reworked.** Ratings are now per-episode: one locked
  vote per (judge, user, episode), can't be changed (rate route INSERTs, catches
  23505 → 409; `/panel` form locks once rated). Final judge score = trust-weighted
  mean Σ(score·trust)/Σ(trust) over ALL the judge's ratings across episodes
  (`lib/judges.js`).
- **Per-episode judge lineup.** Judges stay in the Redis pool (reused by slug id,
  never recreated). New `Episode.judge_ids` records allocation; admin picks judges
  per episode at `/admin/episodes/[id]`; `/panel` shows only allocated judges.
- **Trust rises with latent points** — `cron/trust-engine` activity signal now
  `min(0.15, latent_points_alltime/1500·0.15)` (was a hardcoded placeholder).
- **Live global post-karma** (earlier): likes + roast upvotes call
  `adjust_user_karma(user_id, ±1)`; karma is one global ledger row per user.
- Success toast on the admin episode edit form (`components/admin/ToastForm.js`).

## Next action
- **Run the un-applied migrations in Supabase, in order:** `0021`, `0022`
  (karma), `0023` (JudgeRating `(judge_id,user_id,episode_id)` unique constraint —
  this is what stops double-voting), `0024` (`Episode.judge_ids`).
- Then in `/admin/episodes/[id]`, allocate judges per episode (existing episodes
  start with none → `/panel` shows no judges until allocated).

## Decisions (with reasoning)
- Judges kept in Redis pool, NOT migrated to the `Judge` table — they already have
  stable slug ids, so allocation just stores ids per episode. Smallest change.
- One vote per judge/episode is enforced by DB unique constraint + INSERT (not
  upsert) + UI lock; trust-weighting uses CURRENT `User.trust_score` at read time.
- Uploaded thumbnails are committed under `public/uploads/` (no object storage).

## Do not touch
- `score_episode_predictions` (0017) — non-idempotent counters; don't toggle
  `is_revelation_triggered` manually.
- Server-side "judge must be allocated to episode" check was intentionally NOT
  added (UI gates it); harden if crafted requests are a concern.

## Blockers
- None. Branches are local-only; nothing pushed to origin.
