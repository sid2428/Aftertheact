# Handoff — 2026-06-28
last_commit: 0458c6f
branch: main

## Done (2026-06-28)
- Diagnosed "images not loading" on production (misreported as Supabase failure;
  data loads fine, only `/uploads/*` images 404'd). Root cause: poisoned CDN
  cache of 404s. Images were referenced before the files were deployed -> early
  404s; `next.config.mjs` tags `/uploads/:path*` `immutable, max-age=1yr` by
  PATH, so 404s cached for a year (Cloudflare + Vercel). Files exist now (commit
  0458c6f) and origin serves 200 — proven by cache-bust: `samay-raina.jpg?cb=x`
  -> 200 JPEG; plain URL -> cached 404 (`cf-cache-status: HIT`).

## Next action
1. PURGE CDN cache (Cloudflare -> Caching -> Purge Everything, or prefix
   `/uploads/`). Unblocks images now. Manual — not in repo. Then verify
   `https://www.aftertheact.com/uploads/judges/samay-raina.jpg` returns the image.
2. STILL PENDING from 2026-06-26 (verify before assuming done): run un-applied
   Supabase migrations in order `0021`,`0022` (karma), `0023` (JudgeRating unique
   constraint = stops double-voting), `0024` (`Episode.judge_ids`). Memory note
   also flags `0026` (prod missing 0021/0022/0025 RPCs+tables). Then allocate
   judges per episode at `/admin/episodes/[id]` (existing episodes start empty).

## Decisions (with reasoning)
- Soften `/uploads/:path*` header from `immutable,max-age=31536000` to
  `public,max-age=3600,stale-while-revalidate=86400`: stops 404s freezing for a
  year, and judge files use slug names (not UUIDs) so `immutable` also blocks
  in-place photo swaps. NOT APPLIED — config shared across worktrees; coordinate.
- (2026-06-26) Judges live in Redis pool by slug id; per-episode allocation just
  stores ids. One vote per (judge,user,episode) via DB unique constraint + INSERT
  + UI lock. Uploads committed under `public/uploads/` (no object storage).

## Do not touch
- The 6 `.claude/worktrees/*` — another agent is actively working there.
- `next.config.mjs` — pending the coordinated edit above.
- `score_episode_predictions` (migration 0017) — non-idempotent counters; don't
  toggle `is_revelation_triggered` manually.

## Blockers
- Cache purge needs Cloudflare dashboard access (cannot be done from the repo).
