# Vote → Waiting → Reveal Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop showing the voting UI to users who already voted (per contestant, and as a full "waiting for reveal" room once they've voted for everyone), add an optional admin-set reveal countdown, surface each user's own cast scores on the reveal page, and make the signed-in home redirect land on the latest revealed episode when nothing is live.

**Architecture:** The episode page (`src/app/episode/[id]/page.js`) already fetches everything per-request from Supabase; add one more query for the signed-in user's `UserVote` rows for this episode, turn that into a `{contestantId: score}` map, and branch rendering off it. No new routes, no new tables besides one nullable timestamp column.

**Tech Stack:** Next.js 16 server components, Supabase (`@supabase/supabase-js`), NextAuth session, Framer Motion (already a dependency, no new deps).

## Global Constraints

- No new npm dependencies.
- This repo has no test framework (`package.json` has no Jest/Vitest/Playwright, no existing test files) — every task's verification step is a manual `npm run dev` walkthrough, not an automated test. Do not add a test framework as part of this plan.
- Follow existing file/style conventions exactly (Tailwind classes, `font-display`/`font-mono` usage, `#0A0A0A`/`#111111` palette, `latent-gold`/`latent-crimson` accent colors) — copy patterns from the files being edited, don't invent new ones.
- `reveal_at` reaching the past does NOT auto-flip episode status — admin still clicks the existing "Trigger Revelation" button. The countdown is informational only.

---

### Task 1: `reveal_at` column + admin can set it

**Files:**
- Modify: `supabase/schema.sql` (Episode table, ~line 33-46)
- Modify: `src/app/actions/admin.js` (`updateEpisode`, line 96-109)
- Modify: `src/app/admin/episodes/[id]/page.js` (episode details form, line 50-61)

**Interfaces:**
- Produces: `Episode.reveal_at` — nullable ISO timestamp string (or `null`) as read from Supabase. Later tasks read `episode.reveal_at` directly off the episode row already being fetched.

- [ ] **Step 1: Add the column to the schema file**

In `supabase/schema.sql`, inside the `Episode` table definition, add the column and a comment with the statement to run against the already-deployed database (there's no migrations folder in this repo — `schema.sql` is hand-applied):

```sql
-- Table: Episode
CREATE TABLE IF NOT EXISTS "Episode" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    air_date TIMESTAMP WITH TIME ZONE NOT NULL,
    voting_window_open TIMESTAMP WITH TIME ZONE,
    voting_window_close TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'REVEALED', 'ARCHIVED')),
    is_revelation_triggered BOOLEAN DEFAULT false,
    reveal_at TIMESTAMP WITH TIME ZONE,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (season_number, episode_number)
);
-- Existing deployed DB: ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS reveal_at TIMESTAMP WITH TIME ZONE;
```

- [ ] **Step 2: Run the column-add against the live database**

Run this in the Supabase SQL editor (or via the `supabase` MCP/CLI if you have credentials wired up):

```sql
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS reveal_at TIMESTAMP WITH TIME ZONE;
```

Expected: statement succeeds (or no-ops if already applied). Verify with:

```sql
SELECT reveal_at FROM "Episode" LIMIT 1;
```
Expected: returns a row with `reveal_at = NULL`, no error.

- [ ] **Step 3: Persist `reveal_at` from the admin form**

In `src/app/actions/admin.js`, `updateEpisode` (currently lines 96-109), add the field to the update payload:

```js
export async function updateEpisode(formData) {
  await verifyAdmin();
  const supabase = getServiceSupabase();
  const id = formData.get("episode_id");
  const revealAt = formData.get("reveal_at");
  await supabase.from("Episode").update({
    season_number: parseInt(formData.get("season_number")),
    episode_number: parseInt(formData.get("episode_number")),
    title: formData.get("title"),
    air_date: new Date(formData.get("air_date")).toISOString(),
    admin_note: formData.get("admin_note") || null,
    reveal_at: revealAt ? new Date(revealAt).toISOString() : null,
  }).eq("id", id);
  revalidatePath(`/admin/episodes/${id}`);
  revalidatePath(`/episode/${id}`);
}
```

- [ ] **Step 4: Add the form field**

In `src/app/admin/episodes/[id]/page.js`, inside the "Episode Details" form (after the Admin Note field, before the submit button — currently line 59-60), add:

```jsx
        <div><label className={labelClass}>Admin Note</label><textarea name="admin_note" defaultValue={episode.admin_note || ""} rows={2} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Reveal At (optional — shows a countdown to voters who&apos;ve voted)</label>
          <input
            type="datetime-local"
            name="reveal_at"
            defaultValue={episode.reveal_at ? new Date(episode.reveal_at).toISOString().slice(0, 16) : ""}
            className={inputClass}
          />
        </div>
        <button className="bg-latent-gold text-[#0A0A0A] px-6 py-2 font-display font-black uppercase rounded-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">Save Changes</button>
```

(This replaces the two existing lines at the end of that form — the `admin_note` div stays as-is, the `reveal_at` div and the button are new/moved.)

- [ ] **Step 5: Manually verify**

Run: `npm run dev`
1. Sign in as an admin, go to `/admin/episodes/<any-episode-id>`.
2. Set "Reveal At" to a time 2 minutes from now, click "Save Changes".
3. Reload the page — the datetime field should still show the value you set (proves it persisted and round-trips through `toISOString().slice(0,16)`).
4. Clear the field and save again — reload, field should be empty (proves `null` round-trips too).

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql src/app/actions/admin.js "src/app/admin/episodes/[id]/page.js"
git commit -m "feat: admin can set an optional reveal_at timestamp on episodes"
```

---

### Task 2: Persist per-contestant vote state across reloads

**Files:**
- Modify: `src/components/LiveVoting.js` (line 13-20, 97-114, 174-178)
- Modify: `src/components/VotingSection.js` (line 7, 56-65)
- Modify: `src/app/episode/[id]/page.js` (line 26-67, 171-180)

**Interfaces:**
- Consumes: `episode.reveal_at` from Task 1 (not used yet — Task 3 uses it).
- Produces: `userVotesMap` — a plain object `{ [contestantId: string]: number }` built in `src/app/episode/[id]/page.js`, passed as `userVotes` prop into `VotingSection`. Later tasks (3, 4) reuse this same `userVotesMap` variable in the same file.

- [ ] **Step 1: Seed `LiveVoting`'s locked state from a prop instead of always starting blank**

In `src/components/LiveVoting.js`, change the component signature (line 13) and the two `useState` calls (lines 18-19):

```js
const LiveVoting = forwardRef(function LiveVoting({ episodeId, contestantId, initialRawScore = 0, initialUserScore = null, isEpisodeClosed = false, onRevealClose }, ref) {
  const [liveScore, setLiveScore] = useState(initialRawScore || 0);
  const [voterCount, setVoterCount] = useState(0);
  const [intPart, setIntPart] = useState(null); // null = untouched, shows "-"
  const [decPart, setDecPart] = useState(null);
  const [hasVoted, setHasVoted] = useState(initialUserScore != null);
  const [lockedScore, setLockedScore] = useState(initialUserScore);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [revealData, setRevealData] = useState(null); // { userScore, crowdAverage } | null
```

- [ ] **Step 2: Use `lockedScore` (not the live-derived `score`) everywhere a vote is already locked**

In `lockVote` (currently line 55-70), record the locked score explicitly on success:

```js
  const lockVote = async () => {
    if (hasVoted || isSubmitting || score === null) return false;
    setIsSubmitting(true);
    setError(null);
    setHasVoted(true); // optimistic lock
    const result = await submitVote(episodeId, contestantId, score);
    if (!result.success) {
      setError(result.error || "Something went wrong. Try again.");
      setHasVoted(false);
    } else {
      setLockedScore(score);
      // Show the reveal pop-up with the locked score and the live crowd average.
      setRevealData({ userScore: score, crowdAverage: result.newRawAverage ?? score });
    }
    setIsSubmitting(false);
    return result.success;
  };
```

Then in the `isEpisodeClosed` branch (currently line 97-114), swap `score` for `lockedScore`:

```js
  if (isEpisodeClosed) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center gap-3 py-10">
        <span className="font-display font-black text-sm uppercase tracking-widest text-white/40">
          Voting has closed
        </span>
        {hasVoted && lockedScore !== null ? (
          <span className="font-display font-black uppercase tracking-widest text-latent-gold">
            Your verdict was locked at {lockedScore.toFixed(1)}.
          </span>
        ) : (
          <span className="font-mono font-bold text-white/50 text-sm">
            Crowd: <span className="text-white">{(liveScore || 0).toFixed(1)}</span>/10
          </span>
        )}
      </div>
    );
  }
```

And in the locked-display branch near the bottom (currently line 174-178):

```js
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-latent-gold font-display font-black uppercase tracking-widest text-lg">
          Verdict Locked at {lockedScore.toFixed(1)}. Wait for the reveal.
        </div>
      )}
```

(This fixes a real bug, not just adds the new prop: previously this branch read `score`, which is derived from `intPart`/`decPart` — both `null` until the user touches the wheels in *this* render. Once `hasVoted` can come from a server-seeded prop instead of only from `lockVote` in the same session, `intPart`/`decPart` are never set, so `score` would be `null` and `.toFixed(1)` would throw. `lockedScore` is always set whenever `hasVoted` is true, from either path.)

- [ ] **Step 3: Forward the per-contestant score through `VotingSection`**

In `src/components/VotingSection.js`, accept a `userVotes` prop (default `{}`) on line 7, and pass the right score into each `LiveVoting` (currently line 56-65):

```js
export default function VotingSection({ episodeId, contestants, userVotes = {}, isEpisodeClosed = false }) {
```

```jsx
              <div className="flex-1 w-full">
                <LiveVoting
                  ref={(el) => (cardRefs.current[i] = el)}
                  episodeId={episodeId}
                  contestantId={c.id}
                  initialRawScore={c.initialRawScore}
                  initialUserScore={userVotes[c.id] ?? null}
                  isEpisodeClosed={isEpisodeClosed}
                  onRevealClose={() => scrollToNext(i)}
                />
              </div>
```

- [ ] **Step 4: Fetch the user's votes on the episode page and pass them down**

In `src/app/episode/[id]/page.js`, after `sortedAppearances` is computed (currently ends at line 60), add the query and map, right before `const isClosed = ...` (line 62):

```js
  const userVoteRows = session?.user
    ? (await supabase
        .from("UserVote")
        .select("contestant_id, score")
        .eq("episode_id", episode.id)
        .eq("user_id", session.user.id)).data
    : [];

  const userVotesMap = Object.fromEntries(
    (userVoteRows || []).map((v) => [v.contestant_id, v.score])
  );

  const isClosed = episode.status === "REVEALED" || episode.status === "ARCHIVED";
```

Then pass `userVotes` into `VotingSection` (currently line 171-180):

```jsx
                <VotingSection
                  episodeId={episode.id}
                  contestants={sortedAppearances.map((app) => ({
                    id: app.Contestant.id,
                    name: app.Contestant.name,
                    talent_type: app.Contestant.talent_type,
                    image_url: app.Contestant.image_url,
                    initialRawScore: app.peoples_verdict_raw,
                  }))}
                  userVotes={userVotesMap}
                />
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`
1. Sign in, open a `LIVE` episode with at least 2 contestants.
2. Lock a verdict for contestant A only. The card should flip to "Verdict Locked at X. Wait for the reveal." (unchanged behavior).
3. **Reload the page.** Contestant A must still show "Verdict Locked at X..." (this is the fix — previously it would show the blank scroll-wheel UI again and error on re-submit). Contestant B (not yet voted) must still show the normal voting UI.
4. Confirm voting on contestant B still works and locks normally.

- [ ] **Step 6: Commit**

```bash
git add src/components/LiveVoting.js src/components/VotingSection.js "src/app/episode/[id]/page.js"
git commit -m "fix: persist per-contestant vote state across page reloads"
```

---

### Task 3: Waiting room once the user has voted for everyone

**Files:**
- Create: `src/components/WaitingForReveal.js`
- Modify: `src/app/episode/[id]/page.js` (line 166-182)

**Interfaces:**
- Consumes: `userVotesMap` and `sortedAppearances` from Task 2 (same file, same variables — no new query needed).
- Produces: `WaitingForReveal` component — props `{ revealAt: string|null, votes: Array<{name: string, score: number}> }`.

- [ ] **Step 1: Create the waiting-room component**

`src/components/WaitingForReveal.js`:

```jsx
"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function WaitingForReveal({ revealAt, votes }) {
  const target = revealAt ? new Date(revealAt).getTime() : null;
  const [remaining, setRemaining] = useState(() => (target ? target - Date.now() : null));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="bg-[#111111] border border-brand-border rounded-md p-8 sm:p-12 text-center space-y-8">
      <h3 className="text-3xl font-display font-black uppercase tracking-widest text-latent-gold">
        Verdicts Locked
      </h3>
      <p className="text-white/50 font-mono font-bold">Your votes are in. Sit tight for the reveal.</p>

      {target && remaining > 0 ? (
        <div className="font-mono font-black text-4xl sm:text-5xl text-white">
          {formatRemaining(remaining)}
        </div>
      ) : target ? (
        <div className="font-display font-black uppercase tracking-widest text-latent-crimson animate-pulse-fast">
          Reveal is imminent...
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
        {votes.map((v) => (
          <div key={v.name} className="flex justify-between items-center bg-[#050505] border border-brand-border rounded-sm px-4 py-3">
            <span className="font-display font-bold uppercase text-white/70">{v.name}</span>
            <span className="font-mono font-black text-latent-gold">{v.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Branch the episode page's LIVE rendering on `allVoted`**

In `src/app/episode/[id]/page.js`, add the import (near the other component imports at the top):

```js
import WaitingForReveal from "@/components/WaitingForReveal";
```

Compute `allVoted` right after `userVotesMap` (from Task 2 Step 4):

```js
  const allVoted = sortedAppearances.length > 0 &&
    sortedAppearances.every((app) => userVotesMap[app.Contestant.id] != null);
```

Replace the LIVE branch (currently line 166-182):

```jsx
          {episode.status === "LIVE" ? (
            allVoted ? (
              <WaitingForReveal
                revealAt={episode.reveal_at}
                votes={sortedAppearances.map((app) => ({
                  name: app.Contestant.name,
                  score: userVotesMap[app.Contestant.id],
                }))}
              />
            ) : (
              <div className="relative">
                {/* Live heartbeat behind the voting cards */}
                <div className="episode-pulse pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2" />
                <div className="relative">
                  <VotingSection
                    episodeId={episode.id}
                    contestants={sortedAppearances.map((app) => ({
                      id: app.Contestant.id,
                      name: app.Contestant.name,
                      talent_type: app.Contestant.talent_type,
                      image_url: app.Contestant.image_url,
                      initialRawScore: app.peoples_verdict_raw,
                    }))}
                    userVotes={userVotesMap}
                  />
                </div>
              </div>
            )
          ) : (
```

(The closing `)}` and the `REVEALED`/`ARCHIVED` branch below it are unchanged from Task 2.)

- [ ] **Step 3: Manually verify**

Run: `npm run dev`
1. As admin, set the episode's "Reveal At" to 90 seconds from now (Task 1's form) and save.
2. As a voter, open the `LIVE` episode and lock verdicts for every contestant.
3. After the last lock, reload the page — the whole "Lineup" section should now show the "Verdicts Locked" waiting room (no scroll-wheel UI anywhere), listing every contestant with the score you cast, and a live countdown ticking down.
4. Wait for the countdown to hit zero — it should switch to "Reveal is imminent..." instead of going negative.
5. Repeat with no `reveal_at` set on the episode — waiting room should show with no countdown line at all.

- [ ] **Step 4: Commit**

```bash
git add src/components/WaitingForReveal.js "src/app/episode/[id]/page.js"
git commit -m "feat: show waiting room with countdown once user has voted for every contestant"
```

---

### Task 4: Show the user's own score on the reveal page

**Files:**
- Modify: `src/components/ContestantCard.js` (line 6, 55-72)
- Modify: `src/app/episode/[id]/page.js` (line 184-195)

**Interfaces:**
- Consumes: `userVotesMap` from Task 2 (same file).
- Produces: `ContestantCard` gains a `userScore` prop (`number|null`).

- [ ] **Step 1: Add the prop and display to `ContestantCard`**

In `src/components/ContestantCard.js`, update the signature (line 6):

```js
export default function ContestantCard({ contestant, appearance, episodeStatus, userScore = null }) {
```

In the `isRevealed` block (currently line 55-72), add the line right after `<SplitFlapScoreboard appearance={appearance} />`:

```jsx
        {isRevealed && (
          <div className="space-y-6 mt-2">
            <SplitFlapScoreboard appearance={appearance} />

            {userScore != null && (
              <div className="text-center font-mono text-sm text-white/50">
                Your verdict: <span className="text-latent-gold font-black">{userScore.toFixed(1)}</span>
              </div>
            )}

            {/* Controversy Flag */}
            {appearance.controversy_flag && (
              <ControversyBadge />
            )}
```

- [ ] **Step 2: Pass `userScore` from the episode page**

In `src/app/episode/[id]/page.js`, in the `RevelationSequence` branch (currently line 184-195), add `userScore` to the `ContestantCard`:

```jsx
            <RevelationSequence isRevealed={episode.status === "REVEALED" || episode.status === "ARCHIVED"}>
              {sortedAppearances.map((app) => (
                <RevelationItem key={app.id}>
                  <ContestantCard
                    contestant={app.Contestant}
                    appearance={app}
                    episodeStatus={episode.status}
                    userScore={userVotesMap[app.Contestant.id] ?? null}
                  />
                </RevelationItem>
              ))}
            </RevelationSequence>
```

- [ ] **Step 3: Manually verify**

Run: `npm run dev`
1. Vote on a `LIVE` episode as a logged-in user, then (as admin) trigger revelation on it.
2. Open the episode page — each contestant card you voted for shows "Your verdict: X" under the scoreboard with the score you actually cast.
3. Open the same page logged out (or as a user who never voted) — no "Your verdict" line appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContestantCard.js "src/app/episode/[id]/page.js"
git commit -m "feat: show the signed-in user's own score on the reveal page"
```

---

### Task 5: Home redirect falls back to the latest revealed episode

**Files:**
- Modify: `src/app/page.js` (line 22-26)

**Interfaces:**
- Consumes: nothing from earlier tasks — independent.

- [ ] **Step 1: Extend the signed-in redirect**

In `src/app/page.js`, replace lines 22-26:

```js
  // Signed-in: jump straight to the live voting episode. If nothing's live,
  // fall back to the latest revealed episode's results; otherwise the scoreboard.
  if (session?.user) {
    const live = episodes?.find((ep) => ep.status === "LIVE");
    const revealed = episodes?.find((ep) => ep.status === "REVEALED" || ep.status === "ARCHIVED");
    redirect(live ? `/episode/${live.id}` : revealed ? `/episode/${revealed.id}` : "/scoreboard");
  }
```

(`episodes` is already sorted newest-first by `season_number`/`episode_number` descending in the query above, so `.find()` for `revealed` naturally picks the latest one.)

- [ ] **Step 2: Manually verify**

Run: `npm run dev`
1. With no `LIVE` episode and at least one `REVEALED` or `ARCHIVED` episode in the DB, sign in — you should land on `/episode/<latest revealed episode id>` showing results, not `/scoreboard`.
2. With a `LIVE` episode present, sign in — you should still land on that episode (unchanged from before).
3. With neither a `LIVE` nor any `REVEALED`/`ARCHIVED` episode, sign in — you should land on `/scoreboard` (unchanged fallback).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.js
git commit -m "feat: signed-in home redirect falls back to latest revealed episode"
```
