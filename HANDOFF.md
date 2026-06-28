# Handoff — 2026-06-28
last_commit: 0458c6f
branch: main

## Done
- Diagnosed "images not loading" on production (was misreported as a Supabase
  connection failure — data loads fine; only `/uploads/*` images 404'd).
- Root cause confirmed: poisoned CDN cache of 404s. `/uploads/judges/*.jpg` etc.
  were referenced before the image files were deployed, so early requests 404'd.
  `next.config.mjs` applies `Cache-Control: public, max-age=31536000, immutable`
  to `/uploads/:path*` by path — so those 404s got cached for a year by
  Cloudflare + Vercel edge. Files now exist (in commit 0458c6f) and origin
  serves 200 — proven via cache-bust: `.../samay-raina.jpg?cb=x` -> 200 JPEG,
  plain URL -> cached 404 (`cf-cache-status: HIT`, `x-vercel-cache: HIT`).

## In progress
- Nothing committed for the fix yet. This handoff only.

## Next action
1. PURGE CDN cache (Cloudflare dashboard -> Caching -> Purge Everything, or
   prefix `/uploads/`). This unblocks images immediately. (Manual — not in repo.)
2. Then verify `https://www.aftertheact.com/uploads/judges/samay-raina.jpg`
   (no query string) returns the image.

## Decisions (with reasoning)
- Recommend softening the `/uploads/:path*` header in `next.config.mjs` from
  `immutable, max-age=31536000` to `public, max-age=3600, stale-while-revalidate=86400`.
  Two reasons: (a) stops 404s being frozen for a year; (b) judge files use slug
  names (`samay-raina.jpg`), not UUIDs — `immutable` would also block in-place
  photo replacements. NOT YET APPLIED (config is shared across 6 active
  worktrees + another agent — coordinate before editing).

## Do not touch
- The 6 `.claude/worktrees/*` worktrees — another agent is actively working there.
- `next.config.mjs` — pending the coordinated edit above.

## Blockers
- Cache purge requires Cloudflare dashboard access (cannot be done from the repo).
