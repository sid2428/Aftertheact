# AfterTheAct — Full Implementation Guide
**Last updated:** June 2026  
**Stack:** Next.js 16 (App Router) · Supabase · Upstash Redis · Framer Motion · Tailwind v4  
**Video asset:** `The_transition_between_the_mic.mp4` (10 seconds, H.264 1280×720 @ 24fps)

---

## Table of Contents
1. [Intro Sequence — Video + Curtain + Hero Flow](#1-intro-sequence)
2. [CurtainHero Redesign with Judges Panel & Images](#2-curtainhero-redesign)
3. [Per-Page Hero Redesign — No Void Space](#3-per-page-hero-redesign)
4. [Post-Vote Result Reveal Pop-up](#4-post-vote-result-reveal-pop-up)
5. [Voting Logic — Full Backend Fix](#5-voting-logic-full-backend-fix)
6. [Scoreboard & Label Renames](#6-scoreboard--label-renames)
7. [Interactive Backgrounds](#7-interactive-backgrounds)
8. [Judges Panel — Photos, Bio, Judge the Judges](#8-judges-panel)
9. [Community Page — The Green Room](#9-community-page)
10. [General Professionalism Upgrades](#10-general-professionalism-upgrades)
11. [Database Schema Changes](#11-database-schema-changes)
12. [Backend API Routes to Create or Fix](#12-backend-api-routes-to-create-or-fix)
13. [Environment Variables](#13-environment-variables)
14. [File Asset Checklist](#14-file-asset-checklist)

---

## 1. Intro Sequence

### What the video contains
The uploaded video `The_transition_between_the_mic.mp4` (10 seconds) has three distinct phases:
- **0–6 seconds:** Animated 3D gold "AFTER THE ACT" logo on a dark background, rotating/zooming in with sparkles
- **6 seconds:** A golden vintage microphone on a stage with blue velvet curtains, dramatic spotlights crossing from above, then lights dim to a single overhead cone — this is the visual "curtain moment"
- **7–10 seconds:** The gold "AFTER THE ACT" logo re-appears, now stamped on a dark concrete/brushed-metal wall — final logo lock-up

### Target user experience on homepage load
```
[0s]  Video plays from beginning — logo animation  (0–6s)
[6s]  JavaScript pauses the video on frame 6
      CSS-animated red curtains fly in from left and right, covering the screen
      Curtains animate in over ~0.6 seconds  
[6.6s] JavaScript resumes the video from 7 seconds  
      Curtains are still covering screen during this 0.5s buffer
[7.1s] Curtains sweep back out (slide off left and right, ~0.8s ease-out)  
      The video is now playing from second 7 — logo on concrete wall  
[10s] Video ends — fade to black over 0.5 seconds  
      Then the hero section (judge faces + logo + CTAs) fades in as the final state
```

### Implementation: `src/components/IntroSequence.js` (new file)
- Create this as a `"use client"` component
- Render the entire homepage (CurtainHero and all sections below) inside this wrapper
- The wrapper contains: an absolutely-positioned fullscreen video player, the CSS curtain overlays, and a visibility toggle for the real page content
- The video element should be `muted`, `autoPlay`, `playsInline`, `preload="auto"`, no controls shown, `object-fit: cover`, and absolutely positioned to fill the screen
- The video source is `/intro.mp4` (copy the uploaded file to `public/intro.mp4`)
- The curtain overlays are two `div` elements positioned absolutely: one covering the left 52% of the screen and one covering the right 52%, both with `background-color: #8B1E2D` (the latent-crimson red) and a subtle velvet texture applied via a repeating SVG background or CSS noise pattern
- Animate the curtains using framer-motion: initial position is `x: -101%` (left) and `x: 101%` (right); on trigger they animate to `x: 0` (in) and then to `x: -101%`/`x: 101%` (out); use `ease: "easeInOut"` for the sweep-in, `ease: "circOut"` for the sweep-out
- Use a `useRef` on the video element and a `useEffect` with `requestAnimationFrame` to poll `video.currentTime`; when it reaches 6.0, call `video.pause()`, trigger the curtain-in animation, then after 600ms set `video.currentTime = 7.0` and call `video.play()`
- When the video's `onEnded` event fires, fade the video opacity to 0 over 500ms and set a state `introComplete: true` which reveals the real hero content
- The real hero content should start at `opacity: 0` and animate to `opacity: 1` when `introComplete` becomes true
- Add a "Skip Intro" button in the top-right corner of the fullscreen overlay, styled as a small ghost button (white text, white border, transparent background), that sets `introComplete: true` immediately
- Use `sessionStorage` to track if the user has already seen the intro in this browser session; if they have, skip directly to the hero content without playing the video. Key: `ata_intro_seen`
- The entire intro sequence should be wrapped in a check for `prefers-reduced-motion`; if the user prefers reduced motion, skip straight to the hero

### Integration: `src/app/page.js`
- Wrap the return JSX inside `<IntroSequence>` so the video plays before the homepage content appears
- Pass `panelMembers` down as a prop through `IntroSequence` to `CurtainHero` so data flows correctly
- Keep all existing server-side Supabase fetches at the top of the server component; only the presentation is affected

---

## 2. CurtainHero Redesign

### Current issues
- Judge faces are hidden on mobile entirely
- Blue curtain background image is static and bland
- No interactive elements on judge avatars
- Empty space beside the logo on narrow viewports
- CTAs are plain

### New CurtainHero layout
The hero should use a full-viewport dark stage background with animated elements, not an image file.

**Background:** Remove the `<img src="/bluecurtains-bg.png">`. Replace with:
- A `<canvas>` element that fills the entire hero div, rendered by a lightweight particle system: 60–80 small golden particles (3–6px circles, opacity 0.3–0.6) that drift upward slowly (1–3px/frame), wrap from bottom when they exit the top, and occasionally twinkle (opacity pulse)
- Behind the canvas: a CSS gradient: `radial-gradient(ellipse at 50% 80%, rgba(139,30,45,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 50%), #080808`
- Two slow-sweeping spotlight cone shapes using CSS `clip-path` triangles or SVG polygons, absolutely positioned, animated with keyframes to move from left to right and back over 15–20 seconds, opacity 0.06–0.08

**Judge face layout — desktop:** Keep the existing flanking layout (left half on left, right half on right). Changes:
- Increase avatar size to `w-24 h-24 lg:w-32 lg:h-32`
- Instead of a circular crop, use a slightly angled `transform: rotate(Ndeg)` on each Face card — alternate between -3deg and +3deg per judge, creating a "pinned photos" effect
- Add `box-shadow: 0 8px 32px rgba(0,0,0,0.6)` beneath each image to sell the physical cutout look
- On hover, the image should `scale(1.08)` and the rotation should return to 0deg (straighten out), with a gold glow on the border
- Each Face should also show a tooltip on hover: a small `div` that appears above the avatar with the judge's name and their descriptor tag (e.g. "The Wildcard") — this is positioned absolutely, fades in with `opacity: 0 → 1`, and disappears on mouse-out

**Judge face layout — mobile:** Instead of hiding all judge faces, render them in a horizontally scrollable strip below the logo. Use an `overflow-x: auto` container with `display: flex` and `gap: 16px` and `padding: 16px`. Each mobile face card is smaller (`w-16 h-16`) and shows name below it. Show all 5 judges in this strip on mobile.

**Logo:** Keep centered. Add a subtle breathing animation using framer-motion: `scale: [1, 1.015, 1]` on a 4-second loop, mimicking the logo being "alive". Add a soft gold radial glow that also pulses behind it.

**CTAs:** Give both CTA buttons a shimmer sweep effect on idle — a `::after` pseudo-element with a white diagonal gradient that sweeps from left to right on a 3-second loop using a CSS keyframe animation. The "Join the Jury" button should also have a red pulse-ring animation (expanding ring outline that fades out) to draw attention.

**Tagline:** Add a line below the logo, above the CTAs: `"The show ends. The receipts begin."` in Oswald font, uppercase, letter-spacing `0.2em`, text color `#D4AF37`, font-size `clamp(0.9rem, 2vw, 1.2rem)`. Animate it in last (after the logo), with a typewriter-style reveal using CSS animation or framer-motion's character stagger.

**Scroll indicator:** Add at the absolute bottom of the hero div: a small animated downward chevron icon (use the existing svg from ScoreboardHero) with text "SCROLL" in white/30, bouncing vertically on a 1.5s loop.

---

## 3. Per-Page Hero Redesign

Every page currently has a hero that is text-only. Add visual anchors in the void space on left and right sides.

### Scoreboard page (`ScoreboardHero` component)
**Current:** Full-viewport text-only hero with gradient bg and a tagline.  
**Change:** 
- Left side of the hero: stack 3 contestant portrait images (pulled from the top 3 scoreboard entries via props that the parent passes down from the Supabase query). Display them as overlapping polaroid-style cards, rotated ±4–6deg, fanning out from bottom-left. Each card has a white border (`border: 4px solid white`), a drop shadow, and the contestant's name in a monospace font below it, written as if on a label.
- Right side: a large decorative element — the word "VERDICT" spelled vertically in massive Oswald font, color `rgba(255,255,255,0.03)`, absolutely positioned, not interactive, purely atmospheric
- Pass the top 3 appearances from `CommunityScoreboard` (the parent server component in `scoreboard/page.js`) into `ScoreboardHero` as a `topThree` prop. ScoreboardHero is currently not receiving any props — update the call site and component signature.

### Leaderboard page (`/leaderboard`)
**Current:** Inline hero with radial gradient and text.  
**Change:**
- Refactor the inline hero into a `LeaderboardHero` component
- Left decorative area: a vertical stack of 3 small circular avatars for the top 3 users (leaderboard data already available in the parent — pass as prop)
- Right decorative area: a stylised trophy icon (SVG, hand-drawn style, gold fill) at about 200×200px, placed absolutely in the right side, slightly overlapping the edge, with a subtle glow filter
- Behind the text: a faint diagonal stripe pattern using `repeating-linear-gradient` at 45deg, very low opacity (3–4%), gold color, alternating with transparent — giving it a "red-carpet striped floor" feel

### Episodes page (`/episodes`)
**Current:** No hero at all — content starts directly.  
**Change:**
- Add a hero section above `EpisodeDirectory`
- The hero should be 40vh tall with the heading "THE LINEUP" on the left in large Oswald font
- Right side: show thumbnail/poster images for the 3 most recent episodes — if episodes have a `thumbnail_url` column, use it; otherwise use a placeholder stage image (`/stage-placeholder.jpg` — add this asset, a dark stage with spotlight, can be a screenshot from the intro video at 3s)
- Extract a frame from the intro video at ~3 seconds using ffmpeg and save as `/public/stage-placeholder.jpg` — this gives a beautiful stage with gold mic and blue curtains

### Episode detail page (`/episode/[id]`)
**Current:** Sticky header only, then contestant cards below.  
**Change:**
- Add a mini-hero band below the sticky header: 80–100px tall, spanning full width, dark bg with a subtle gradient
- Left 30% of the band: episode metadata (season, episode number, air date) in mono font
- Center: episode title large in Oswald
- Right 30%: if the episode is LIVE, show the pulsing "VOTING OPEN" badge + the count of current voters (fetch from Redis: `hlen episode:{id}:scores` to get contestant count, or track separately); if ARCHIVED/REVEALED, show the final average score and total voter count
- Behind the band: use the episode's `thumbnail_url` as a blurred background image if available (`filter: blur(20px) brightness(0.3)`)

### Community page (`/community`)
Described in section 9.

---

## 4. Post-Vote Result Reveal Pop-up

### Trigger
After `lockVote()` in `LiveVoting.js` returns `result.success === true`, trigger the reveal modal. Currently the component just sets the locked state and shows "Vote Locked at X.X. Wait for the reveal." — replace this with the pop-up.

### Pop-up design
The pop-up is a modal overlay that covers the entire viewport (not just the card). It should:

- Backdrop: `position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px)`
- Modal content box: centered, max-width 480px, `background: #111111; border: 1px solid rgba(212,175,55,0.3); border-radius: 4px; padding: 2rem`
- Animate in with framer-motion: `scale: 0.8 → 1`, `opacity: 0 → 1`, `duration: 0.4s`, spring physics
- On mobile: render as a bottom sheet instead — position fixed to bottom, full width, rounded top corners, slides up with `y: 200% → 0`

### Pop-up content
Display in order:
1. A header line: `"YOUR VERDICT IS IN"` in Oswald, uppercase, letter-spacing widest, color white
2. The user's locked score in giant mono font (the `score` value): gold color, 80–96px, with a subtle counter animation from 0 to the final value over 0.8 seconds using framer-motion's `useMotionValue` and a spring
3. A divider line
4. Below the divider: `"CROWD AVERAGE"` label in small mono font, and the live community average score (the `newRawAverage` returned from `submitVote`) next to it in crimson — also animate this number counting up
5. A divergence indicator: compute `Math.abs(userScore - crowdAverage)`. If difference > 2.0, show a gold badge: `"HIGH DIVERGENCE 🔥 — You're an outlier"`. If difference < 0.5, show: `"ALIGNED WITH THE CROWD ✓"`. Otherwise no badge.
6. A close button at the bottom: `"CLOSE"` ghost button; also auto-dismiss after 10 seconds with a visible countdown ring (CSS conic-gradient progress ring) around the close button that depletes over 10 seconds

### Confetti
When the pop-up opens, trigger a `canvas-confetti` burst (already installed):
- Confetti colours: `['#D4AF37', '#F5D97B', '#8B1E2D', '#ffffff']`
- Origin: `{ x: 0.5, y: 0.6 }`
- `particleCount: 80`, `spread: 70`, `startVelocity: 30`
- Fire once when the modal mounts

### Implementation notes
- Pass `onRevealClose` callback from `VotingSection` down into `LiveVoting` so that when the user closes the modal, the parent can update state (e.g. scroll to next contestant)
- The `submitVote` server action already returns `newRawAverage` — use this value directly
- Store the reveal state in a local `useState` inside `LiveVoting`: `revealData: { userScore, crowdAverage } | null`
- When `revealData` is not null, render the modal as a portal using `createPortal(modal, document.body)` so it escapes any `overflow: hidden` containers

---

## 5. Voting Logic — Full Backend Fix

### Issues in current `submitVote` (src/app/actions/vote.js)

**Issue 1 — Race condition on the Redis hash update**  
The current code does `hget → parse → increment → hset` in three separate operations. Between `hget` and `hset`, another request could have incremented the same value, causing a lost update.  
**Fix:** Replace the get-parse-increment-set pattern with two separate Redis atomic operations:
- Use `HINCRBYFLOAT` for the total score: `redis.hincrbyfloat(hashKey, contestantId + ':total', score)`
- Use `HINCRBY` for the vote count: `redis.hincrby(hashKey, contestantId + ':count', 1)`
- When reading (in the SSE route), change the hgetall parsing to look for `contestantId + ':total'` and `contestantId + ':count'` keys

**Issue 2 — No DB-level unique constraint**  
Redis prevents duplicate votes, but the `UserVote` Postgres table has no unique constraint. If Redis state is lost, a user could vote twice.  
**Fix:** Add a unique constraint on `(user_id, episode_id, contestant_id)` in the `UserVote` table via a Supabase migration. Also update the fire-and-forget Postgres insert to use `.upsert({ onConflict: 'user_id,episode_id,contestant_id' })` instead of `.insert()`.

**Issue 3 — Postgres insert is fire-and-forget with no error recovery**  
If the Postgres insert fails silently, the vote is lost from the permanent record.  
**Fix:** Add structured logging when the async insert fails. Use `console.error` with a structured object: `{ event: 'vote_insert_failed', userId, episodeId, contestantId, score, error: error.message }`. In production, pipe this to your logging service. Do not block the user response waiting for Postgres.

**Issue 4 — `trust_score_at_vote` fallback is wrong**  
`session.user.trust_score || 0.3` — if a user has a trust score of 0, this would use 0.3 instead. Use `session.user.trust_score ?? 0.3` (nullish coalescing, not OR).

**Issue 5 — No validation on `episodeId` and `contestantId`**  
Both are passed from the client and used directly in queries. Add validation: both should be non-empty strings or UUIDs. Reject anything that fails a basic format check before hitting the database.

**Issue 6 — No feedback to user on which specific error occurred**  
The `alert(result.error)` in `LiveVoting.js` is jarring and unstyled. Replace with an inline error state inside the voting card — a red banner that appears below the scroll dials with the error message, styled consistently.

### SSE live score route improvements (`src/app/api/episodes/[id]/live/route.js`)

**Issue 1 — 10 second polling is too slow for a "live" feel**  
Reduce the interval to 5 seconds.

**Issue 2 — No contestant count being broadcast**  
Add to the SSE payload: `voterCount: totalVotersForEpisode`. To compute this efficiently, maintain a Redis counter key `episode:{id}:voter_count` incremented by `INCR` in `submitVote` after a successful Redis rate-limit check.

**Issue 3 — Parsing uses conditional typeof check which is fragile**  
Change to always call `JSON.parse(String(dataStr))` in a try-catch.

**Issue 4 — The SSE route sends an initial "connected" message but the client doesn't use it**  
The initial message is fine, but add a heartbeat ping every 25 seconds (`data: {"type":"ping"}`) to prevent proxies from closing idle connections.

### LiveVoting client improvements (`src/components/LiveVoting.js`)

- After a successful vote lock, instead of the current string "Vote Locked at X.X. Wait for the reveal.", show the reveal pop-up (section 4) and then transition the card to a quiet "locked" state once the modal is closed
- Add an `isEpisodeClosed` prop passed from `VotingSection` — when true, replace the entire voting UI with a "Voting has closed" message and show the locked score if the user already voted
- On the SSE `onmessage`, also update a `voterCount` local state and display it near the "Crowd:" score as "N people have voted"
- Handle SSE `onerror` gracefully — show a small "Reconnecting..." badge instead of silently failing

---

## 6. Scoreboard & Label Renames

Apply these text replacements across the codebase (component files, page files, and any string literals):

| Current text | New text | Where |
|---|---|---|
| "Community Scoreboard" | "The Verdict Board" | `scoreboard/page.js`, page title |
| "Latent Score" (column header) | "Jury Score" | `scoreboard/page.js` table header |
| `#` prefix on ranks | Remove `#`, display `RANK` as eyebrow label above number | `scoreboard/page.js` rank column |
| "Oracle Board" | "Prophet's Wall" | `leaderboard/page.js`, nav in `layout.js` |
| "Prediction Score" | "Oracle Accuracy" | `leaderboard/page.js` |
| "Rank" column | "Standing" | `leaderboard/page.js` |
| "Episode Directory" | "The Lineup" | `EpisodeDirectory.js` |
| "Scoreboard" nav link | "Verdict Board" | `layout.js` nav |
| "Oracle Board" nav link | "Prophet's Wall" | `layout.js` nav |
| "Peoples Verdict" | "Crowd Verdict" | `SplitFlapScoreboard.js` |
| "Judge Avg" | "Panel Score" | `SplitFlapScoreboard.js` |
| "The Wall of Shame & Fame 🤡" | "EVERY SCORE. EVERY RECEIPT." | `ScoreboardHero.js` badge label |
| "Voting Window Open" | "LIVE — Cast Your Verdict" | `episode/[id]/page.js` status badge |
| "Lock Vote" button | "LOCK MY VERDICT" | `LiveVoting.js` button label |
| "Lock All Votes" button | "LOCK ALL VERDICTS" | `VotingSection.js` button label |
| "Showrunner" admin link | Keep as is | `layout.js` |

### Nav additions
- Add "The Green Room" link (to `/community`) in the nav for all users (logged in and logged out)
- Add "Judge the Judges" link (to `/panel`) visible only when `session?.user` is truthy
- On mobile nav (if it exists — if not, add a hamburger menu), include all nav items in the mobile drawer

---

## 7. Interactive Backgrounds

Apply these background treatments to every page. Do not use a single flat `bg-[#0A0A0A]` anywhere.

### Base background system (apply globally via `globals.css`)
Replace the `body { background: var(--color-brand-bg) }` rule with a layered background:
- Base color: `#080808`
- Add a CSS animation `@keyframes grain` that moves a noise texture subtly — use an inline SVG data URL for a `feTurbulence` SVG filter noise pattern as a `background-image`. The animation should shift the `background-position` by a few pixels every frame to make it feel organic. Opacity: 5%.
- Apply the grain as a `::after` pseudo-element on `body` so it doesn't interfere with child stacking contexts

### Homepage hero (CurtainHero)
- Described in section 2: particle canvas + spotlight cones + radial gradients
- Add a "stage floor" effect at the very bottom of the hero: a reflective strip using `background: linear-gradient(to top, rgba(212,175,55,0.05), transparent)` at the bottom 15% of the hero div

### Scoreboard page
- Behind the scoreboard table rows, add a very subtle repeating grid pattern: `background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, transparent 1px), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, transparent 1px); background-size: 40px 40px`
- Apply to the `.scoreboard-table-wrapper` container, not the whole page

### Episode voting page
- Add a slow radial pulse behind the voting cards: an absolutely positioned `div` centered on the page, with `border-radius: 50%; background: transparent; box-shadow: 0 0 0 0px rgba(139,30,45,0.2)`. Animate with `@keyframes episodePulse`: `0% { box-shadow: 0 0 0 0px rgba(139,30,45,0.2) } 100% { box-shadow: 0 0 0 80px rgba(139,30,45,0) }` on a 3-second infinite loop. This simulates the heartbeat of a live vote.
- Use `will-change: box-shadow` on this element and wrap the keyframe in `@media (prefers-reduced-motion: no-preference)` to disable it for reduced-motion users

### All pages
- Every `glass-panel` div should have a very subtle animated shimmer on its border: use a CSS `background-clip: padding-box` trick with a conic gradient border, animated to rotate slowly (60-second loop)
- This is a subtle premium touch — keep the rotation very slow so it doesn't distract

---

## 8. Judges Panel

### Data model
The judges are currently stored in Redis (`panel:members`) as `[{ name, image }]`. Extend this structure to include:
- `instagram_handle` (string, e.g. "@judgename")
- `descriptor` (string, e.g. "The Wildcard" / "The Poet" / "The Brutalist" / "The Optimist" / "The Enigma")
- `bio` (string, 1–2 sentences)
- `id` (string UUID, generated when added)

Update `setPanelMembers` and `getPanelMembers` in `src/lib/panel.js` to use this new shape. Update the Admin panel UI where judges are added to include input fields for these new fields.

### Judge photo cutouts
- Source 5 judge photos from their Instagram profiles
- Remove the background from each using remove.bg or Photopea — the output should be a PNG with transparency where the background was
- Name the files: `public/judges/judge-1.png` through `public/judges/judge-5.png`, or by name slug (e.g. `public/judges/ranveer.png`)
- Each PNG should be at least 600×800px at export, portrait orientation, showing the person from at least mid-chest up
- In the `Face` component inside `CurtainHero.js`, render these PNGs directly (not inside a `border-radius: 50%` clip) so the cutout silhouette is visible at the edges — the natural shape of the person's outline shows
- Add `drop-shadow(0 12px 24px rgba(0,0,0,0.7))` to each image via CSS `filter` to make them appear to float above the background

### JudgePanel section (new component: `src/components/JudgePanel.js`)
- Create a horizontal row section to appear on the homepage, below the CurtainHero and above the DivergenceSeismograph
- Section heading: `"THE PANEL"` in Oswald, uppercase, with a thin gold hairline rule below it
- Each judge card in the row:
  - Cutout PNG image, 180px wide, overflowing slightly upward from the card container (giving a "larger than life" effect)
  - Below the image overflow: a dark panel `bg-[#111111] border border-white/10` containing name, descriptor tag, and Instagram handle as a `<a>` link
  - On hover: card lifts `translateY(-8px)`, image brightness increases, border color shifts to gold
- All 5 cards in a row on desktop (with `overflow-x: scroll` on mobile for the same strip behaviour as the hero mobile view)
- Below the cards: a "RATE THE PANEL →" link button pointing to `/panel` (the Judge the Judges page)

### Judge the Judges page (`src/app/panel/page.js`, new file)
- Server component that fetches judges from Redis and aggregate ratings from Supabase (`JudgeRating` table — see section 11)
- Renders a `JudgePageClient` client component with the fetched data
- Page hero (see section 3 style): heading "JUDGE THE JUDGES", subheading "The jury is now on trial.", left-side decorative element: scales-of-justice SVG illustration in gold outline style

**Judge card on this page:**
- Full cutout image at ~300px wide, with name and descriptor
- Below the image: three horizontal rating bars (average scores from community ratings):
  - HARSHNESS: `avgHarshness.toFixed(1) / 10` — use a progress bar with `background: linear-gradient(to right, #8B1E2D, transparent)`
  - ACCURACY: `avgAccuracy.toFixed(1) / 10` — use a progress bar with `background: linear-gradient(to right, #D4AF37, transparent)`
  - ENTERTAINMENT: `avgEntertainment.toFixed(1) / 10` — use a progress bar with `background: linear-gradient(to right, #F5D97B, transparent)`
- Total ratings count: "Rated by N jurors"
- Badges: "MOST CONTROVERSIAL" (crimson badge) shown on the judge with the highest standard deviation in harshness scores; "FAN FAVOURITE" (gold badge) shown on the judge with the highest entertainment score
- Below each judge card: an expandable rating form (accordion-style, hidden by default, reveals on "Rate This Judge" button click):
  - Three labelled sliders or scroll-digit pickers (reuse the `ScrollDigit` component): Harshness, Accuracy, Entertainment — each 1 to 10
  - An optional comment textarea (max 200 characters)
  - A submit button: "SUBMIT RATING"
  - If the user has already rated this judge for any episode, show their previous ratings pre-filled and a note "You've already rated this judge. Submit to update your rating."
  - Only show the rating form if `session?.user` — otherwise show "Sign in to rate the judges"

**API route for judge ratings:** `src/app/api/judges/[judgeId]/rate/route.js` (POST)
- Auth check: require session
- Validate body: `{ harshness: number(1-10), accuracy: number(1-10), entertainment: number(1-10), comment?: string }`
- Upsert into `JudgeRating` table on `(judge_id, user_id)` unique constraint — one rating per judge per user (not per episode; this is a cumulative impression rating)
- Respond with the new aggregate averages for that judge so the client can update the bars without a page refresh

---

## 9. Community Page

### Route: `/community`
New file: `src/app/community/page.js` — server component that:
- Fetches the 20 most recent `CommunityPost` rows with author name and avatar from Supabase (joined to `User` table)
- Fetches the 3 most-liked posts from the last 24 hours for the "Hot Takes" sidebar
- Passes data to `CommunityPageClient` (`src/components/CommunityPageClient.js`)

### Page hero
A 45vh hero with heading `"THE GREEN ROOM"` on the left in Oswald, massive scale. Subheading: `"No filter. No mercy. Just takes."` Below the subheading: three stat pills showing live numbers from Supabase: "N Posts Today", "N Active Roasters", "Most Roasted: [contestant name]".  
Right side of the hero: a decorative collage — 4–5 overlapping speech bubble shapes (CSS `polygon` clip-paths or SVGs) in gold and crimson, filled with placeholder quotes in micro font (can be static strings: "Talent is relative 🔪", "Judges were sus tbh", "Who approved that act?", etc.). This fills the void space on the right and gives the page personality.

### Feed
Below the hero, a two-column layout on desktop: the main feed (70%) and a sidebar (30%).

**Compose box** (top of feed, logged-in only):
- A `<textarea>` styled to look like a legal pad or receipt — dark bg, faint horizontal lines as `background-image: repeating-linear-gradient(...)`, monospace font
- Below the textarea: character counter (`N / 280`), a tag selector dropdown (`<select>` styled to match the design system: dark bg, gold accent border, Oswald font) populated with all contestant names and episodes
- Submit button: `"DROP THE MIC 🎤"` — crimson background, white text, Oswald bold
- On submit: POST to `src/app/api/community/posts/route.js` (new), then optimistically prepend the new post to the feed using React state

**Post card:**
- Dark `#111111` panel, border `rgba(255,255,255,0.08)`, rounded corners `4px`
- Top row: circular avatar (40×40), username in Oswald bold, timestamp in mono font ("2h ago"), and a tag badge if the post is tagged to a contestant or episode (gold badge for contestant, crimson badge for episode)
- Body text in Inter, 15px, white/90, line-height 1.6
- Bottom row: heart icon + like count (click to toggle like, POST to `/api/community/posts/[id]/like`), speech bubble icon + reply count (expands inline replies), flag icon (opens a modal to confirm report)
- Liked state: heart fills to crimson with a small scale-up animation on click
- If the current user is the author, show a trash icon to delete their own post

**Inline replies:**
- When the reply count is clicked, expand a sub-section below the post showing all replies in the same card
- Each reply: smaller avatar (28px), username, timestamp, text
- A reply compose input appears at the bottom of the expanded section (single-line input, 200 char max, "Reply" button)

**Hot Takes sidebar (desktop only):**
- Heading: `"🔥 HOT TAKES"` in Oswald
- 3 post cards in a compact format (no replies, just text + author + like count)
- Below: a link `"All Takes →"` scrolls to top of feed

**Logged-out state:**
- Show the first 5 posts with a blur overlay on posts 4 and 5
- Over the blurred posts: a full-width CTA banner: `"JOIN THE JURY TO SEE MORE — and add your own take"` with a "Sign In" button

### API routes for community
All new files:
- `src/app/api/community/posts/route.js`: GET (paginated feed, `?page=N&limit=20`), POST (create post, requires auth)
- `src/app/api/community/posts/[id]/route.js`: DELETE (own post only, requires auth)
- `src/app/api/community/posts/[id]/like/route.js`: POST (toggle like, requires auth)
- `src/app/api/community/posts/[id]/replies/route.js`: GET (fetch replies), POST (add reply, requires auth)
- `src/app/api/community/posts/[id]/report/route.js`: POST (flag post, requires auth)

**Rate limiting on post creation:** Use Upstash Redis. Key: `community:post:ratelimit:{userId}`. Use a sliding window: allow max 10 posts per user per hour. Use `redis.incr` with `expireat` to implement this without the Upstash rate-limit package if not installed.

### Admin integration
- In `AdminDashboardClient`, add a "Reported Posts" section alongside the existing "Held Roasts" section
- Fetch reported posts from `PostReport` table joined to `CommunityPost` — show posts with `report_count > 0`
- Admin actions: "Approve" (delete the report) or "Remove Post" (delete the post and notify user via a flag on their profile)
- Add a `moderation_status` column to `CommunityPost` (`VISIBLE` / `REMOVED`) and filter the public feed to only show `VISIBLE` posts

---

## 10. General Professionalism Upgrades

### Navigation
- The nav currently has no active link indicator. Add an underline or dot indicator for the currently active page — compare `pathname` from `usePathname()` against each link's href and apply a gold bottom border to the matching link
- The mobile nav needs to exist. Add a hamburger menu button (3 horizontal lines icon from lucide-react: `<Menu>`) visible on `md:hidden`. On click, it opens a full-screen overlay (fixed, z-50, dark bg) with all nav links vertically stacked in large Oswald font. The overlay slides in from the right. Add an `<X>` close button.
- Add a `title` and `description` metadata export to every page that doesn't have one (episodes, leaderboard, episode detail, community, panel)

### Loading states
- Every page that fetches data should have a proper `loading.js` file in its directory that renders a skeleton screen matching the page layout. Currently none exist.
- For the voting cards, add a skeleton state that shows while the SSE connection is establishing (first 2 seconds before the first data arrives)
- Use Tailwind's `animate-pulse` on placeholder elements in skeletons

### Error boundaries
- Add `error.js` files to the episode detail route (`src/app/episode/[id]/error.js`) and community route. These should render a styled error state using the existing design system instead of the bare Next.js error page.

### Image optimisation
- Replace all `<img>` tags with Next.js `<Image>` from `next/image` wherever the image dimensions are known at build time. This applies to: judge avatars in `CurtainHero`, contestant images in `scoreboard/page.js`, and user avatars in `leaderboard/page.js`.
- For externally hosted images (Instagram, Supabase storage), add the relevant domains to `next.config.js` under `images.remotePatterns`.

### Typography consistency
- Ensure all page headings use `font-display font-black uppercase tracking-tighter` (Oswald)
- Ensure all scores and numbers use `font-mono font-black` (JetBrains Mono)
- Ensure all body copy uses `font-sans` (Inter) at weight 400 or 500, line-height 1.6
- Audit all pages for any place where Tailwind default font classes (`font-sans`, `font-bold`) are used without the custom font variable — correct these

### Hover & focus states
- Every interactive element (buttons, links, cards) must have a `:focus-visible` outline that contrasts against the dark background. Use `outline: 2px solid #D4AF37; outline-offset: 3px` as the global focus style, added in `globals.css`.
- This makes the site keyboard-navigable and accessible

### Transitions
- Add `transition-all duration-200` to all interactive elements that don't already have it — buttons, nav links, card hovers
- All page-level content should animate in with a subtle `opacity: 0 → 1, y: 10px → 0` on mount using framer-motion `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>` wrappers on each major section

### Footer
- The current footer is minimal. Extend it to three columns:
  - Column 1: logo + tagline
  - Column 2: quick links (Verdict Board, Prophet's Wall, The Lineup, The Green Room, Judge the Judges)
  - Column 3: social/legal (a placeholder for Instagram/Twitter links, and a "Disclaimer: Fan Community Site" note)
- Add a thin gold hairline rule above the footer content

---

## 11. Database Schema Changes

All changes below should be implemented as Supabase SQL migrations. Create one migration file per logical group.

### Migration 1 — UserVote unique constraint
```sql
ALTER TABLE "UserVote"
  ADD CONSTRAINT "UserVote_user_episode_contestant_unique"
  UNIQUE (user_id, episode_id, contestant_id);
```

### Migration 2 — Judge table
```sql
CREATE TABLE "Judge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  instagram_handle TEXT,
  image_url TEXT,
  bio TEXT,
  descriptor TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 3 — JudgeRating table
```sql
CREATE TABLE "JudgeRating" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID REFERENCES "Judge"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  harshness_score SMALLINT CHECK (harshness_score BETWEEN 1 AND 10),
  accuracy_score SMALLINT CHECK (accuracy_score BETWEEN 1 AND 10),
  entertainment_score SMALLINT CHECK (entertainment_score BETWEEN 1 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (judge_id, user_id)
);
CREATE INDEX idx_judgerating_judge_id ON "JudgeRating"(judge_id);
```

### Migration 4 — CommunityPost table
```sql
CREATE TABLE "CommunityPost" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 280),
  contestant_tag UUID REFERENCES "Contestant"(id) ON DELETE SET NULL,
  episode_tag UUID REFERENCES "Episode"(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'VISIBLE' CHECK (moderation_status IN ('VISIBLE', 'REMOVED', 'HELD')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_communitypost_created ON "CommunityPost"(created_at DESC);
CREATE INDEX idx_communitypost_user ON "CommunityPost"(user_id);
CREATE INDEX idx_communitypost_likes ON "CommunityPost"(like_count DESC);
```

### Migration 5 — CommunityPostLike table
```sql
CREATE TABLE "CommunityPostLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);
```

### Migration 6 — CommunityPostReply table
```sql
CREATE TABLE "CommunityPostReply" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reply_post ON "CommunityPostReply"(post_id);
```

### Migration 7 — PostReport table
```sql
CREATE TABLE "PostReport" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, reporter_user_id)
);
```

### Migration 8 — Episode thumbnail column
```sql
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

### Migration 9 — User voter tracking counter (optional Redis, but DB backup)
```sql
ALTER TABLE "UserVote" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_uservote_episode ON "UserVote"(episode_id);
```

### Supabase Row Level Security
For all new tables, enable RLS and add policies:
- `CommunityPost`: SELECT is public (where moderation_status = 'VISIBLE'), INSERT requires auth (user_id = auth.uid()), DELETE requires auth (user_id = auth.uid() OR user is admin)
- `CommunityPostLike`: SELECT public, INSERT requires auth, DELETE requires auth (user_id = auth.uid())
- `CommunityPostReply`: SELECT public, INSERT requires auth
- `PostReport`: INSERT requires auth; SELECT restricted to admin role only
- `JudgeRating`: SELECT public (for aggregate display), INSERT/UPDATE requires auth (user_id = auth.uid())
- `Judge`: SELECT public, INSERT/UPDATE/DELETE restricted to service role only (managed via admin UI or direct Supabase dashboard)

---

## 12. Backend API Routes to Create or Fix

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/community/posts` | Create community post | Required |
| GET | `/api/community/posts` | Paginated feed | Public |
| DELETE | `/api/community/posts/[id]` | Delete own post | Required, own only |
| POST | `/api/community/posts/[id]/like` | Toggle like | Required |
| GET | `/api/community/posts/[id]/replies` | Get replies | Public |
| POST | `/api/community/posts/[id]/replies` | Add reply | Required |
| POST | `/api/community/posts/[id]/report` | Report post | Required |
| POST | `/api/judges/[judgeId]/rate` | Submit judge rating | Required |
| GET | `/api/judges/[judgeId]/ratings` | Get judge aggregate ratings | Public |
| GET | `/api/episodes/[id]/live` | SSE live scores | Public (already exists, fix bugs from section 5) |
| GET | `/api/episodes/[id]/voter-count` | Get total unique voter count | Public |
| POST | `/api/admin/community/posts/[id]/moderate` | Approve or remove a flagged post | Admin only |

For all new routes:
- Return JSON with `{ success: true, data: ... }` on success and `{ success: false, error: "..." }` on failure
- Use HTTP status codes correctly: 200 for success, 400 for validation errors, 401 for auth required, 403 for forbidden, 500 for server errors
- Add `try/catch` around all database calls and return a 500 with a generic message (never expose raw DB error messages to clients)

---

## 13. Environment Variables

These must be present in `.env.local`. Check that all are defined; the app will throw on startup if any are missing.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=       (if using Google OAuth)
GOOGLE_CLIENT_SECRET=   (if using Google OAuth)
```

No new environment variables are required for the changes in this document. All Redis, Supabase, and auth operations use existing keys.

---

## 14. File Asset Checklist

These physical files must be added to the `/public/` directory before the described UI changes will render correctly.

| File path | What it is | How to obtain |
|---|---|---|
| `public/intro.mp4` | The uploaded transition video | Copy from the uploaded file provided |
| `public/stage-placeholder.jpg` | Still frame from intro video at 3 seconds | Run: `ffmpeg -i intro.mp4 -ss 3 -frames:v 1 public/stage-placeholder.jpg` |
| `public/judges/judge-1.png` | Judge 1 cutout PNG (transparent bg) | Source from Instagram, process with remove.bg |
| `public/judges/judge-2.png` | Judge 2 cutout PNG | Same |
| `public/judges/judge-3.png` | Judge 3 cutout PNG | Same |
| `public/judges/judge-4.png` | Judge 4 cutout PNG | Same |
| `public/judges/judge-5.png` | Judge 5 cutout PNG | Same |
| `public/logo.png` | Already exists | No change |
| `public/curtains-left.png` | Already exists | No change |
| `public/curtains-right.png` | Already exists | No change |

The intro video should be compressed for web delivery. Recommended settings if re-encoding: H.264, CRF 23, `faststart` flag enabled (for streaming before full download), 720p max. The current file at ~2.5MB is acceptable for web.

---

*End of implementation guide. Each section is self-contained and can be assigned to a developer independently. Sections 1, 4, and 5 are the highest priority for the voting experience. Sections 2, 3, and 7 are the highest priority for visual quality.*
