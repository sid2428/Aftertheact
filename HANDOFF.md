# Handoff — 2026-06-25
last_commit: ab2a9807c8bb4d7405a726de59517b8e29b7be70
branch: main

## Done
- Hero judge faces (src/components/CurtainHero.js): absolutely-positioned slots flanking the logo, one cycling PNG cutout per side, gold glow, logo unaffected.
- User profile page (`src/app/my-profile/page.js`): votes grouped by episode (read-only, no delete), "Your Comments" panel (`src/components/ProfileCommentsPanel.js`) with delete + "this is permanent" confirm popup, wired to the existing `DELETE /api/community/posts/[id]`.
- Signout is now a confirm popup (not NextAuth's own page) in `MainNav.js` and a new `src/components/admin/AdminLogoutButton.js` for the admin Control Panel header (`src/app/admin/layout.js`).
- Judge the Judges (`/panel`) reworked to match the contestant voting UI: one overall score via `ScrollDigit` (1–10) + pick-one vibe tag, replacing the old 3-slider form. Tags default to 6 presets, editable per judge in `/admin/panel` (`tags` field, comma-separated).
- Judge ratings now scoped per episode (episode pill-tabs on `/panel`, newest first) via new `episode_id` column + unique constraint on `JudgeRating`. `src/lib/judges.js` aggregation rewritten for `overall_score`/`tag` instead of harshness/accuracy/entertainment.
- New `/judges-scoreboard` page: ranks judges by total votes received, then avg score ("popularity").
- Migrations added: `migrations/0009-judgerating-overall-tag.sql`, `migrations/0010-judgerating-episode.sql`.

## In progress
- Nothing mid-edit. All above is committed (`ab2a980`) and already pushed to `origin/main`.

## Next action
- **Run migrations 0009 and 0010 against the live Supabase DB** (no migration runner in this repo — apply manually, same as 0001-0008). Judge rating/scoreboard will error until this is done.
- Visually verify hero face cycling, the new /panel episode tabs, and /judges-scoreboard in a real browser (desktop + mobile).

## Decisions (with reasoning, not just the what)
- Old `harshness_score`/`accuracy_score`/`entertainment_score` columns left in place (unused) rather than dropped — avoids destroying existing rating data.
- Judge tags/episodes still sourced from Redis (`panel:members`) + the existing `Episode` table, not the unused relational `Judge` table — not worth migrating onto it for this change.
- `episode_id` nullable + unique constraint includes it — old cumulative rows (NULL episode_id) don't collide with new per-episode rows.

## Do not touch
- `.claude/worktrees/glowing-soaring-locket` (shows as modified/untracked in git status) — tooling artifact, not application code.

## Blockers
- None, other than the unrun migrations above.
