# Vote → Waiting → Reveal flow

## Problem

`src/app/episode/[id]/page.js` always renders `VotingSection` while an episode is `LIVE`, regardless of whether the signed-in user already voted. "Has voted" only lives in `LiveVoting`'s client `useState`, so a reload (or a fresh login landing on the episode) shows blank voting UI again — the server already rejects the duplicate vote, but the UI doesn't know that.

## Behavior

- **Per contestant**, the episode page checks the DB for an existing `UserVote` row for the signed-in user. Already-voted contestants show their locked score; not-yet-voted contestants show the voting UI. Users can vote across multiple visits.
- Once the user has voted for **every** contestant in the episode, the entire `VotingSection` is replaced by a `WaitingForReveal` view: confirmation + the scores they cast for each contestant + (if admin set one) a countdown to `reveal_at`.
- On reveal (`status` = `REVEALED`/`ARCHIVED`), each `ContestantCard` additionally shows the user's own cast score next to the crowd/panel/latent scores.
- Home page (`/`) redirect for signed-in users: `LIVE` episode → that episode (page decides voting vs. waiting); else latest `REVEALED`/`ARCHIVED` episode → that episode (shows results); else `/scoreboard`.

## Changes

1. **Schema**: `Episode.reveal_at TIMESTAMPTZ NULL` — admin-set, optional. No auto-flip of status; admin still manually triggers reveal via the existing button. The countdown is informational only.
2. **`src/app/episode/[id]/page.js`**: one query — `UserVote` rows for `(user_id, episode_id)` → `{contestantId: score}` map. Drives the LIVE branch (mixed voting/waiting per contestant vs. full waiting room) and is passed through to reveal-mode `ContestantCard`s.
3. **`LiveVoting.js`**: new `initialUserScore` prop seeds `hasVoted`/locked score on mount instead of always starting blank.
4. **`WaitingForReveal.js`** (new): static "locked, waiting for reveal" message + per-contestant cast scores; client-side countdown via `setInterval` if `reveal_at` is set and in the future. No new dependency.
5. **`ContestantCard.js`**: reveal branch shows the user's own score if passed in.
6. **Admin** (`src/app/admin/episodes/[id]/page.js` + `updateEpisode` action): one `datetime-local` field for `reveal_at`.
7. **`src/app/page.js`**: extend the signed-in redirect to fall back to the latest revealed episode before `/scoreboard`.

## Out of scope

- Auto-flipping episode status when `reveal_at` passes (manual trigger stays).
- Changing the "Lock All Verdicts" button behavior.
- New routes — everything reuses `/episode/[id]`.
