# After The Act — UI/UX, Motion & Performance Brief

This is an instructions-only brief for Claude Code to implement directly in the
sid2428/Aftertheact repository. It contains no code — every item below should
be implemented by reading the referenced files and writing the actual
implementation yourself, matching the existing patterns in the codebase
rather than introducing new, parallel ones.

## 1. The Standard This Has To Hit

Judge every change the way a US startup founder, product designer, or
investor would, not the way a developer would. The benchmark is not "better
than before" — it's "would this look completely at home beside Linear,
Stripe, Apple, Vercel, Framer, Arc Browser, or an Awwwards Site of the Day."

Optimize for emotion, storytelling, premium visual quality, art direction,
and product perception. Do not optimize for number of animations, number of
effects, or number of libraries used. Nobody who visits the site will know
or care which library did something — they should just feel like the site
is expensive.

Scope freeze while this polish pass is underway: frontend only. No backend
changes, no API changes, no business-logic changes, and no new features
beyond what is already specified later in this brief. Feature work resumes
only once the frontend reaches this bar.

## 2. Toolset Mandate — One Job Per Library

The repository currently uses Framer Motion, three.js (via
react-three-fiber and drei), canvas-confetti, and animejs. This brief
requires adding GSAP with its scroll-oriented plugins (ScrollTrigger, Flip,
SplitText, MotionPathPlugin, CustomEase, Observer) and Lenis for
smooth/inertia scrolling. That would put three animation engines in the
project at once (Framer Motion, GSAP, animejs) unless animejs is retired —
it should be, once GSAP is in place; see the performance section below.

Give each remaining library one clear job so they reinforce each other
instead of duplicating effort or fighting over the same elements:

- GSAP + ScrollTrigger + Lenis owns anything driven by scroll position
  itself: pinned/scrubbed cinematic sections, the numbered scroll-stepper
  described later in this brief, camera-style push/pull effects, and any
  sequence that should feel directed by how far and how fast the user
  scrolls.
- Framer Motion keeps owning anything driven by component state or data:
  the scoreboard's FLIP-based reordering, presence/exit animations, the
  Green Room typing effect, gesture and drag interactions, and anything
  tied to data changing rather than scroll position.
- React Three Fiber should not be used for incidental decoration. The
  performance section below identifies one specific current use of it
  (a per-card poster tilt) that should be removed, not extended — that is
  not a contradiction of "push R3F further," it's the opposite of what R3F
  is good for. Reserve R3F for exactly one deliberate, shared atmosphere
  layer instead, most naturally folded into the hero: soft volumetric
  particles, gentle environmental lighting, dynamic light response, organic
  drift. The goal is a layer the user feels but never consciously notices,
  not a showcase of WebGL, and not one WebGL canvas per grid item.
- Push CSS further wherever surfaces are touched: mask gradients, blend
  modes, layered/soft-bloom shadows, glass refraction, gradient
  interpolation — all built from the existing CSS custom properties already
  defined in globals.css, never one-off values. Nothing should read as
  visually flat.

Some of GSAP's plugins (SplitText, MotionPathPlugin, Flip, Observer,
CustomEase) have had different licensing terms at different points —
confirm current licensing before depending on any of them, and substitute
the closest GSAP core feature or Framer Motion equivalent if a plugin isn't
freely available, rather than skipping the intent behind it.

## 3. Cinematography & Scene Choreography

Stop thinking in sections; think in shots. Every major section of the
homepage and episodes page should read like a scene, and every transition
between sections like a cut or a camera move, not a scrollbar moving down a
page. Build this using the GSAP/ScrollTrigger/Lenis layer from Section 2:

- Camera-style push and pull — foreground elements moving/scaling at a
  different rate than background elements as the user scrolls, parallax
  with clear intent rather than decoration for its own sake.
- Focus shifts — blur/sharpen or dim/brighten whatever is currently "in
  frame" relative to what's entering or leaving.
- A continuous sense of atmosphere and light across section boundaries —
  lighting and color grading should evolve gradually down the page rather
  than resetting at every section break.
- Anticipation and payoff in every animated sequence: nothing should start
  or stop abruptly. Build toward a moment, deliver it, then ease into
  whatever comes next. Apply this principle specifically to the scoreboard
  rank-change beat and the result-page reveal beat described later in this
  brief — both are explicitly meant to build suspense before paying it off.

## 4. Visual Hierarchy & Art Direction Checklist

Go section by section — hero, judge panel, featured episode split panel,
episode directory, scoreboard, result reveal, Green Room — and for each
one, answer:

- Where should the eye land first, second, third? If that isn't obvious
  within a second of looking, the hierarchy needs work before it needs
  animation.
- Is there enough negative space, or is everything competing for attention
  at once?
- Does the composition feel balanced?
- Does lighting/glow support the one thing that matters in that section, or
  is it spread evenly across everything?
- Does typography scale dominate the way it should — the most important
  number or word on screen should look like the most important thing on
  screen?
- Is there one clear focal point per section, or several fighting each
  other?

Animation cannot fix a section that fails this checklist. Fix the
composition first, then animate it.

## 5. Hero Must Become Iconic

CurtainHero.js is the first impression and needs to be the single strongest
moment on the site — strong enough that someone could recognize the product
from one screenshot of it alone, closer to a premium product-launch reveal
than a typical landing-page hero.

- This is where the one deliberate React Three Fiber atmosphere layer from
  Section 2 belongs — replacing or sitting behind the current 2D canvas
  particle field with something that has real depth and light response,
  not just particles drifting upward.
- Treat the curtain-opening, logo reveal, and judge-face cycling already
  built here as one choreographed sequence with anticipation and payoff
  (Section 3), not three separate animations that happen to run near each
  other.
- Keep pushing until the opening moment feels like a title sequence, not a
  hero banner.

## 6. Microinteractions

Every interactive element should feel handcrafted, not default. Review and
elevate:

- Hover states on every button, card, and row — build on the existing
  tilt/glow patterns already used in ScoreboardRow.js and the episode cards
  rather than introducing new, inconsistent ones.
- Cursor feedback — does the cursor respond near key interactive elements
  (a magnetic pull toward a primary button, a custom cursor state over the
  scoreboard)?
- Click/press feedback — the existing button system's press state in
  globals.css is the right base to extend, not replace.
- Scroll responses — does anything react subtly to scroll velocity or
  direction, not just scroll position?
- Focus states for keyboard users — don't regress the existing
  focus-visible treatment while doing this.
- Loading-state transitions — the scoreboard's empty/skeleton states and
  the result page's reveal-gated states should feel as deliberately
  designed as everything else, not like placeholders.

## 7. Scoreboard / Leaderboard — Cinematic Reveal Pass

Relevant files: ScoreboardRow.js, LiveScoreboard.js, RollingNumber.js,
FeaturedEpisodeSection.js, and the full scoreboard page route.

The scoreboard already does a lot: FLIP-based reordering when ranks change,
a crown and podium treatment for the top three, a count-up animation on
scores and votes, a gold shimmer sweep across the leader's row, pointer-based
3D tilt, and a flash effect on rank changes. The original brief referenced a
movie clip showing a leaderboard reveal, but that video never successfully
attached to this conversation — only two screenshots came through (see the
note at the end of this document).

Direction to push the existing system further, in line with Section 3's
choreography principle:

- Add a short anticipation beat before a rank reorder plays, so a rank swap
  feels choreographed rather than snapping the instant new numbers arrive.
- Give a change in the #1 position its own, more intense version of the
  existing gold shimmer/glow treatment, distinct from an ordinary rank
  change further down the board.
- Apply whatever changes are made here consistently to both places a
  leaderboard appears: the compact homepage panel and the full standalone
  scoreboard page. They should feel like the same component at two sizes.

## 8. Green Room — Typing Effect & Visual Weight

Relevant files: FeaturedEpisodeSection.js (homepage panel) and the full
Green Room / community page route and whatever component it renders.

- Replace the current instant fade-and-slide-in of each post with a
  typewriter-style character-by-character reveal of the message text
  specifically — not the username pill, not the timestamp.
- New posts that arrive live (the realtime feed) should always type in.
  Posts already present on first load: stagger the typing effect across the
  first handful visible on load only, and render anything below the fold
  instantly, so the page doesn't feel slow to settle.
- Increase the visual size and weight of this entire panel: larger message
  text, a larger username pill, more internal padding, a larger card
  radius. It currently reads smaller and paler than the scoreboard side of
  the same split panel — bring it to equal visual weight using the existing
  glass-row treatment already applied to each post card, just turned up in
  scale and contrast, not restyled into something new.

## 9. Result Page — "Audience Poll" Suspense Reveal

Relevant files: episode/[id]/page.js, RevelationSequence.js,
ContestantCard.js, SplitFlapScoreboard.js, RollingNumber.js.

When an episode's status is REVEALED or ARCHIVED, the page currently
fades/scales the contestant cards in, then SplitFlapScoreboard shows the
Self Score, Panel Score and Crowd Score for each contestant via
RollingNumber, which already animates digit-by-digit like a split-flap
board.

Reference for this request: the "Audience Poll" lifeline from Kaun Banega
Crorepati — percentages rapidly flicker up and down through random values
for several seconds, the rate of change gradually slows, and the bars then
lock onto the real final numbers with a distinct settle moment.

Build this as an extension of the existing RollingNumber mechanic, not a
new, separate animation system:

- Before landing on the true final value, drive each score through a short
  sequence of random plausible intermediate values, decelerating as it
  approaches the real number, over a total duration of roughly five
  seconds.
- The final landing needs its own distinct beat — more pronounced than the
  current entrance — so it's unmistakable that the "real" number has now
  appeared. The Crowd Score, being the headline number, should get the most
  pronounced version of this landing moment; Self Score and Panel Score can
  use a quieter version of the same effect.
- This sequence should run once per reveal, gated the same way the
  codebase already gates one-time reveal behavior elsewhere (see how
  revealOnMount is gated in the scoreboard code) — it must not replay every
  time the card scrolls in and out of view.
- Respect reduced-motion the same way RollingNumber already special-cases
  it: reduced-motion users should see a much shorter settle, or none at
  all, and land straight on the real value.

## 10. Numbered Scroll-Stepper Section (reference: buckssauce.com)

Reference site: buckssauce.com, the "Why Bucks Sauce" section partway down
the page. The mechanic to study and re-skin, not copy visually: a
pinned/sticky section with a large outlined numeral (01, 02, 03) that
advances as the user scrolls through it; a thin dashed horizontal line
behind the numeral tracking scroll progress through the section; a small
label pill above a heading; a short paragraph underneath. Movement between
steps is a smooth cross-fade/slide, never an abrupt cut, and the numeral
itself transitions smoothly between values.

Build this using GSAP + ScrollTrigger (pin and scrub) with Lenis powering
the overall smooth-scroll feel, per the toolset division of labor in
Section 2 — this is exactly the kind of scroll-position-driven sequence
GSAP should own rather than Framer Motion.

Re-skin it entirely in the site's own dark/gold/crimson visual language —
none of the reference site's beige palette, fonts, or copy voice should
carry over, only the scrolling mechanic and layout idea. The outlined
numeral should use the display font already used for headings elsewhere,
outlined in the gold accent color; the connecting line should use a
gold-tinted dashed treatment consistent with the rest of the brand.

Apply it in two places:

- The episodes page: either a short stepped explainer of how the
  voting/judging format works, placed above the episode grid, or a
  walkthrough of the season's status — whichever reads as natural
  editorial content. Default to a short "how scoring works" explainer if
  there's no clean three-part content specific to this page.
- The landing page: either replace or sit alongside the existing season
  stats band, or as a new section between the judge panel and the featured
  episode split panel — a numbered walkthrough of how the show's judging
  format works, worded to match the site's existing tone rather than
  generic placeholder copy.

Provide a non-scroll-jacked fallback (plain stacked sections, no pinning)
for reduced-motion users, consistent with how the rest of the site already
degrades gracefully for that preference.

## 11. Site-Wide Cohesion Pass

Go through the homepage, episodes page, scoreboard page, episode detail
page, and community page and check every panel/card against the existing
glass-panel / glass-surface / glass-row utilities already defined in
globals.css. Anywhere a surface uses a flat, undecorated background instead
of one of these (candidates to check specifically: RevelationSequence.js's
outer wrapper, ContestantCard.js's header and body blocks, and
SplitFlapScoreboard.js's score grid), convert it to the shared glass
treatment so the whole page reads as one continuous frosted surface instead
of a stack of separately-styled boxes.

"Looking pale" means low visual contrast and weight relative to the rest of
the site — generous corner radius, a hairline border, a soft inner top
highlight, and a touch of the gold or crimson glow used everywhere else.
Nothing should look like unstyled boilerplate next to a fully designed
section. Keep this pass strictly within the existing color and font
tokens — no new ones.

## 12. Performance & Dead-Code Audit — Performance Is Part Of The Design

A premium frontend is also a fast one. Every animation introduced anywhere
in this brief must justify its performance cost, or it should be
simplified or cut — no exception for how good it looks in isolation.

Confirmed issues to fix, found directly in the current codebase:

- Episode3DPoster.js renders a full WebGL scene (three.js via
  react-three-fiber) with a continuous per-frame render loop, on every
  single episode card, purely to achieve a pointer-tilt effect on a poster
  image — while the EpisodeCard component wrapping it already implements
  its own, separate, lightweight CSS/Framer-Motion pointer-tilt on the
  outer card at the same time. This is duplicated tilt logic, and the WebGL
  version is far more expensive than it needs to be, multiplied across
  every card in a grid. Replace it with the same CSS-transform tilt pattern
  already used in ScoreboardRow.js, and remove the three.js /
  react-three-fiber / drei dependencies entirely unless the single hero
  atmosphere layer from Section 5 ends up using them — in which case keep
  them for that one purpose only.
- CurtainHero.js's particle field runs a requestAnimationFrame loop that
  never stops, even once the hero is scrolled well out of view. Pause it
  via an IntersectionObserver when off-screen and resume it on re-entry.
- The grain texture layer in globals.css (the body::after rule) animates
  every 0.6 seconds, forever, across an oversized full-page layer, on every
  page. Reassess whether it needs to animate continuously at all — a static
  version likely reads almost identically for a fraction of the paint
  cost — and if the animated version is kept, gate it behind
  prefers-reduced-motion the way the rest of the file's other effects
  already are (it currently is not).
- The glass-panel shimmer-spin animation runs indefinitely on every
  instance of that class. Where a page has more than one glass-panel
  element on screen at once, confirm that's intentional rather than several
  copies of the same loop running in parallel for no visible benefit.
- Most uses of Next's Image component across the codebase pass the
  unoptimized prop, turning off Next's built-in image optimization even
  though sharp is already installed specifically to power it. Remove
  unoptimized wherever it isn't strictly required (e.g. a specific external
  domain restriction).
- Now that GSAP is being added (Section 2), remove animejs — three
  animation engines in one project is the kind of duplication this section
  exists to catch. Audit package.json more generally for anything no
  longer imported anywhere once the above changes land.
- More generally: search the codebase for components, hooks, or CSS classes
  that are defined but never imported or referenced anywhere, and delete
  them. Dead code still ships to the browser in a bundled Next.js app even
  if nothing renders it.

## 13. Open Item — "Prophets Wall" (do not build yet)

A search of the live repository — including the README and every component
and route file — turned up no existing feature, page, or component called
"Prophets Wall." The closest existing concept is what the codebase already
calls the Oracle Board: a banner shown on UPCOMING episodes inviting users
to lock in predictions for Top, Bottom, and Alignment before air time,
referenced in episode/[id]/page.js.

Before this item gets built, confirm one of the following:

- "Prophets Wall" is the same idea as the existing Oracle Board, and the
  actual ask is a new public page/feed showing everyone's locked-in
  predictions, plus who ended up being right once the episode is revealed.
- "Prophets Wall" is something else entirely that isn't in the codebase
  yet, in which case a short description of what it should do is needed
  before Claude Code can be briefed on it safely.

This stays out of scope for now regardless, per the Section 1 scope freeze
on new features during this polish pass.

## 14. Missing Reference Asset

The movie clip originally referenced for the leaderboard-animation request
in Section 7 did not actually attach to this conversation — only two
screenshots came through, not the video file itself. Section 7 is written
from the existing scoreboard code plus general creative direction. Re-upload
the video file if frame-accurate matching to that specific clip matters, and
this brief can be revised with the exact timing and motion pulled from it.

## Appendix — Known Files In Scope

Scoreboard / leaderboard: ScoreboardRow.js, LiveScoreboard.js,
RollingNumber.js, the scoreboard page route.

Green Room: FeaturedEpisodeSection.js, the community page route.

Result reveal: episode/[id]/page.js, RevelationSequence.js,
ContestantCard.js, SplitFlapScoreboard.js, RollingNumber.js,
RevealCountdown.js.

Episodes / homepage layout: page.js (homepage), the episodes page route,
EpisodeDirectory.js, Episode3DPoster.js, CurtainHero.js, IntroSequence.js,
JudgePanel.js.

Shared design system: globals.css.
