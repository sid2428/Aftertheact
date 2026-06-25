# AfterTheAct — UI Enhancement Specification v2
**Stack:** Next.js · Supabase · Upstash Redis · Framer Motion (primary animation engine) · Tailwind v4  
**Philosophy:** Motion communicates hierarchy, not decoration. Every effect must earn its place by directing attention or communicating state. The aesthetic is broadcast-quality — cinematic, editorial, deliberate — not game-like or playful.

---

## Design Principles

These govern every decision below. When a detail is ambiguous, apply these.

**1. Motion creates hierarchy.** Only three things deserve prominent animation: the live leaderboard, the voting interaction, and the episode card gallery. Everything else should be quiet.

**2. Transitions are cinematic, not decorative.** Easing should feel like a camera cut or a stage reveal — weighted and intentional. Never bouncy. Never gratuitous.

**3. Effects reinforce competition.** Glows, pulses, and colour shifts should communicate live state (something is happening right now) or rank (someone is winning). Purely aesthetic shimmer belongs on at most two elements site-wide.

**4. The font says everything.** Three fonts only. Typographic contrast — massive display vs small mono — does more work than any particle system.

**5. Restraint is premium.** If an element already has a glow, it does not also get a shimmer and a parallax and a float. Choose one effect per element.

---

## Avoid

These patterns actively harm the experience and must not appear:

- Animations that loop indefinitely without user action (exceptions: the #1 leaderboard row ambient glow, the LIVE pulse dot)
- Blur filters on anything the user needs to read
- Simultaneous competing animations on adjacent elements
- Font weights below 400 on dark backgrounds (illegible)
- More than one `box-shadow` layer on the same element at rest
- Animating `width`, `height`, or `top/left` — use `transform` and `opacity` only
- Parallax on any element containing readable text
- Typing effects on more than one element per page

---

## Performance Budget

- 60 FPS on a mid-range laptop (2019 MacBook Pro equivalent) at all times
- No layout thrashing — all animations use `transform` and `opacity` exclusively
- No animation runs during a network request (voting submission, community post)
- `prefers-reduced-motion`: all decorative motion pauses; functional transitions (state changes, page navigation) reduce to simple `opacity` fades of 150ms

---

## Accessibility Floor

- Every interactive element has a visible `:focus-visible` ring in gold (`outline: 2px solid #D4AF37; outline-offset: 3px`) — add once to `globals.css`
- Leaderboard uses `aria-live="polite"` on the score region so screen readers announce score changes
- All score colour coding (gold/white/crimson) is accompanied by a non-colour indicator (rank badge, size difference) — never colour alone
- No animation flashes more than 3 times per second

---

## Responsive Philosophy

Every component must specify behaviour across three states:

**Desktop** (≥1024px): full layout as designed  
**Tablet** (640–1023px): reduce horizontal complexity, collapse multi-column to 2-column, maintain all animations  
**Mobile** (<640px): single column, hover interactions become tap interactions, sticky CTAs where appropriate

These are defined per-component below.

---

## Architecture Goals

- Animation logic lives in components, never in page files or server actions
- Visual effects are encapsulated — a component that glows does not require its parent to know it glows
- State (vote data, scores, community posts) stays independent of presentation
- Every animated component accepts a `reducedMotion` boolean prop (passed from a top-level `useReducedMotion` hook) to disable decorative effects without touching logic

---

## P0 — Core (Implement First)

---

### P0.1 — Font System

Three fonts. No exceptions.

**Display — Bebas Neue:** All headings at or above `2rem`. Page titles, hero headings, the giant episode numbers (`E3`, `E2`, `E1`), navigation brand name.

**Body — DM Sans:** All prose, labels, subtitles, card descriptions, community posts, form inputs. Weights 400 and 500 only.

**Numbers — Rajdhani:** All scores, ranks, vote counts, timestamps. Weights 600 and 700 only. This font at large sizes turns the jury score from plain text into a broadcast graphic.

Import all three from Google Fonts. Update `globals.css` `@theme` variables. Audit every component and replace font classes accordingly. The scoreboard score numbers (`8.0`, `6.9`, `0.0` from the screenshot) in Rajdhani Bold at large size will be the single most visible improvement across the whole site.

Remove Oswald as the primary display font — demote it to zero usage. Remove Playfair Display entirely. Remove JetBrains Mono and replace with Rajdhani.

---

### P0.2 — Interactive Border & Glow System

The entire site currently uses `rgba(255,255,255,0.08)` borders everywhere — invisible and flat. Define three named states in `globals.css` and apply them consistently:

**Rest state:** Borders are `rgba(255,255,255,0.07)` — barely visible, just enough to separate panels.

**Interactive hover state:** Border transitions to `rgba(212,175,55,0.35)` with a matching `box-shadow` outer glow. Transition duration: fast (`150ms ease-out`).

**Active/live state:** Crimson border `rgba(139,30,45,0.5)` with crimson glow. Used only on LIVE episode badges, the active vote card, and the "LOCK" button while processing.

Buttons follow a parallel system:

- Primary action (Lock Vote, Submit): crimson at rest, intensified glow on hover, glow collapses inward on press
- Secondary (ghost buttons): no glow at rest, gold border glow on hover
- Disabled: 35% opacity, no glow, `cursor: not-allowed`

Add focus styles once globally. Do not add individual focus rules per component.

---

### P0.3 — Animated Live Leaderboard

This is the most important UI element on the site. Build it to feel like a live esports timing board.

**Behaviour:** When scores update, rows reorder themselves by gliding to new positions. No row ever jumps or snaps. The experience communicates that competition is happening in real time.

**Motion system:** Use Framer Motion `layout` + `LayoutGroup` exclusively. Do not add react-spring or any secondary animation engine. Framer Motion's spring system is sufficient. Aim for motion that feels weighted and physical rather than elastic — think Apple UI, not a game.

**Rank change feedback:** When a row improves position, it briefly highlights. When it falls, it briefly dims. The direction of change must be perceptible at a glance. Choose one visual treatment (colour shift or glow) — not both simultaneously.

**Score display:** Scores animate from old value to new value rather than snapping. Each digit rolls upward (or downward) through intermediate values independently. Digits that do not change do not move. The roll should complete in under 500ms.

**Rank #1 treatment:** The leader row is visually distinct at a glance — slightly larger name, gold score colour, a crown icon. It has a permanent but subtle ambient glow that does not compete with rank-change highlights.

**Enter/exit:** New rows fade and scale in. Exiting rows fade and scale out. Surrounding rows reposition using the FLIP system simultaneously.

**Dramatic entrance on mount (for archived scoreboards):** Rows enter with a stagger — earliest rows first — scores counting up from zero to their final value. This is the "results reveal" mode and is the most cinematic moment on the site.

**Data connection for live mode:** Subscribe to Supabase realtime on `ContestantEpisodeAppearance` filtered by the current `episode_id`. When a score update arrives, re-sort and trigger the FLIP animation. The SSE route already exists for this — connect the leaderboard client component to it.

**Responsive:**
- Desktop: full row layout with image, name, bio tag, score, vote bar
- Tablet: hide vote bar, compress bio tag to single line
- Mobile: hide contestant image, show initial avatar letter instead, reduce score font size but keep it dominant

**The contestant image from the screenshot is broken** (showing alt text "Alia", "da goat"). Fix by using Next.js `<Image>` with a local path from `/public/contestants/` and a proper fallback initial-letter avatar when no image is set.

---

### P0.4 — Voting UI

The vote interaction is the highest-stakes moment for a user. It must feel significant.

**ScrollDigit columns:** The visual weight of the selected digit needs to be much higher. The center band should feel like it is physically gripping the number. The digits above and below should fade out convincingly. The selected digit should be noticeably brighter and slightly larger than its neighbours.

When a digit settles (scroll stops), give a brief visual "click" — a fast flash on the center band that confirms selection. This replaces tactile feedback the user can't have on a screen. Implement entirely within Framer Motion — do not add react-spring.

**Score font:** Switch the digit columns from JetBrains Mono to Rajdhani Bold. The size should fill the available vertical space of the column — large enough to feel like you're making a big decision.

**Ghost preview:** While scrolling, show the assembled score (`7.5`, `9.0`, etc.) in very large Rajdhani at low opacity behind the two columns. It updates immediately as digits change. This prevents cognitive load — the user always knows what score they're about to submit without having to mentally assemble the two columns.

**Lock button:** Taller and more authoritative than current (aim for at least 60px height). Bebas Neue label. At rest: dormant. On hover: crimson glow activates. On press: glow collapses inward — physical press feel. On submitting: label swaps to a loading state. On success: button transitions to a confirmation state with green colour. Use Framer Motion `AnimatePresence` with `mode: "wait"` for the label swap so exit animation completes before enter begins.

**Crowd average strip:** Replace the small inline "Crowd: X/10" text with a dedicated display strip above the scroll columns — prominent enough to be immediately readable. Shows live community average and voter count. Updates via the existing SSE connection. The average number uses the same rolling digit animation as the leaderboard score.

**Post-lock reveal modal:** After a successful lock, the result reveal pop-up should be the most dramatic moment in the voting flow — see CHANGES.md (section 4) for the full specification. Fire confetti on open.

**Mobile:** The two digit columns fill a larger proportion of the viewport width. The lock button is sticky to the bottom of the viewport while the voting card is visible, using `position: sticky` within the page's scroll container (not `position: fixed` which would layer over unrelated content).

**Responsive:**
- Desktop: side-by-side layout (photo left, voting right) — existing
- Tablet: stacked (photo top, voting below)
- Mobile: photo collapses to a small strip header; digit columns and lock button take full width

---

### P0.5 — Homepage Restructure

**Remove:** The "Live Controversial" / DivergenceSeismograph element from its current prominent homepage position. Move it below the episode cards section (further down the page).

**New primary scroll destination (first section after the hero):** A split panel showing the most recent episode's scoreboard (left ~55%) alongside the community feed (right ~45%). This is what the user reaches when they first scroll down — active competition data immediately visible.

The mini-scoreboard in this panel uses the same `LiveScoreboard` component from P0.3 in a compact mode (top 5 rows only, no vote bars). The community feed shows the 6 most recent posts, each truncated to 2 lines. A realtime Supabase subscription adds new posts to the top with a brief enter animation. Both panels sit inside a single `glass-panel` container with a vertical gold hairline divider between them.

**Page order after restructure:**
1. IntroSequence (video)
2. CurtainHero (hero)
3. Judge Panel strip
4. Featured Episode split panel (scoreboard + community)
5. Episode card gallery
6. DivergenceSeismograph
7. Footer

---

## P1 — High Impact, Second Phase

---

### P1.1 — Episode Flip Card Gallery

The episodes hero currently shows three static dark cards (`E3`, `E2`, `E1`) fanned out on the right half of the hero. Add life to this without overwhelming it.

**Card arrangement:** Keep the current fan layout. The leftmost card tilts slightly negative Z, the rightmost tilts slightly positive Z, the centre card is upright and slightly forward. The exact angles matter less than the overall fan silhouette — adjust until it looks natural.

**On hover:** The hovered card performs a Y-axis 3D flip. The front shows the current design (episode number + title). The back shows a brief info panel: contestant count, status badge, air date, and a "VIEW EPISODE" link. The 3D flip requires `perspective` on the container and `backface-visibility: hidden` on both faces.

The flip uses Framer Motion's `rotateY` motion value with spring physics. The non-hovered siblings dim slightly — one visual focus at a time.

If a thumbnail image is available for the episode (`Episode.thumbnail_url`), it fills the top portion of the card's front face. If not, the episode number in giant Bebas Neue at low opacity is the placeholder — exactly as in the current screenshot.

**Mobile:** Horizontal scrollable strip. Tap to flip, tap again to flip back. No fan angle on mobile — all cards upright.

**What this is not:** Do not add a parallax, particle system, or ambient glow to these cards. The flip is the singular effect.

---

### P1.2 — Contestant & Judge Photo Upload in Showrunner

The admin panel currently has no image upload capability. Images are entered as URL strings, which is why the scoreboard shows broken images.

**Upload behaviour:** A drag-and-drop zone with click-to-browse fallback. Accepted: `.jpg`, `.png`, `.webp`. Max size enforced on both client and server. On selection, show a preview so the admin can confirm the right photo before saving. On submit, the file is written to `/public/contestants/{slug}.jpg` or `/public/judges/{slug}.png` via a server-side API route. The stored path is saved as `image_url` in the database.

The upload zone is a single shared component used by both contestant and judge forms. The admin receives a clear confirmation when upload succeeds, and a clear error with reason when it fails.

**Server-side:** Use `sharp` to resize and compress the image before writing to disk. Strip EXIF data. Validate MIME type by reading the file header — do not trust the `Content-Type` from the request. Require admin session; reject without it.

**Displaying images:** Once stored locally, use Next.js `<Image>` with the stored path. Add the local pattern to `next.config.js`. The broken images in the scoreboard screenshot will be fixed entirely by this — no URL pasting required.

---

### P1.3 — Photo Card Enter Animation

Contestant cards throughout the site (scoreboard, voting section, episode detail) should reveal when they first enter the viewport.

**One effect only:** A horizontal wipe from left to right using `clipPath`. The card starts fully clipped (`inset(0 100% 0 0)`) and reveals over approximately 600ms with an ease-out curve. Trigger once when the card enters the viewport using `whileInView` from Framer Motion. Do not repeat on scroll.

The contestant name — and only the name — gets a subtle character-by-character stagger as it appears. Nothing else on the card staggers independently.

**Mobile:** Reduce the wipe to a simple `opacity` fade — `clipPath` can be GPU-expensive on older mobile devices.

---

## P2 — Polish, Third Phase

---

### P2.1 — Typing Effect

One typing effect per page. No more.

**Homepage:** The CurtainHero tagline ("The show ends. The receipts begin.") types character by character after the intro sequence completes. A blinking gold cursor appears during typing, then fades after 2 seconds. Use `sessionStorage` to skip this if the user has already seen it this session.

**Community page compose box:** The textarea placeholder cycles through 3 prompts using a typing/deletion animation. This is the only usage of this effect on the community page.

All other pages use instant text — no scramble effects, no typewriter on headings, no per-character stagger on page titles. The leaderboard heading, the hero headings, and the scoreboard title all appear via a single clean `opacity` + `y` entrance, not letter-by-letter.

---

### P2.2 — CurtainHero Background

The current static blue curtain image is replaced with a dynamic stage background. 

A lightweight canvas particle system — 50 to 70 small gold particles drifting upward slowly — sits behind the hero content. Particles are subtle: small radius, low opacity, irregular speeds. They stop entirely under `prefers-reduced-motion`.

Two slow CSS spotlight cone shapes sweep left-to-right on a long loop (15+ seconds). They are near-invisible at rest — only perceivable when the user pauses on the page. They use CSS animations, not JavaScript.

**What this is not:** No mouse parallax on the background. No blur layers. No heavy gradient stacking. The background is atmospheric, not the hero.

---

### P2.3 — Judge Panel Float & Interaction

Each judge photo in the hero and the Judge Panel section floats gently using a CSS `@keyframes` animation. Each photo has a different duration (between 3.5s and 5.5s) and offset so they are asynchronous.

On hover over a judge photo: show a tooltip with the judge's name and descriptor. Use a Radix UI tooltip primitive for accessibility (focus-accessible, escape-dismissible). The tooltip appears with a simple `opacity` + `y` transition — no special morph needed.

Clicking a judge photo briefly scales it up and back. No other effects.

**No mouse-tracking parallax on judge photos.** This was in v1 but is cut — it conflicts with the floating animation and creates visual noise when multiple judges are in view.

---

### P2.4 — Glow on Buttons (Site-Wide Audit)

After P0.2 establishes the glow system, apply it consistently across all buttons in a single pass. The goal is uniformity — buttons on different pages should feel like they belong to the same system.

This is one implementation task, not component-by-component work. Define the three button classes (`btn-primary`, `btn-ghost`, `btn-danger`) in `globals.css` under `@layer components`, then find-and-replace ad-hoc button styling in every component with the appropriate class. The glow, font, padding, and transition are all inherited from the class.

---

## Dependency Decisions

Use Framer Motion as the single animation engine. It handles: FLIP layout, spring physics, AnimatePresence, motion values, scroll tracking, and viewport entry detection (`whileInView`). Do not add react-spring.

Install only what Framer Motion cannot do:

**`react-dropzone`** — file drag-and-drop for the admin image upload. Framer Motion has no file handling capability.

**`sharp`** — server-side image resizing. Runs only in API routes, zero client bundle impact.

**`@radix-ui/react-tooltip`** — accessible tooltip primitives for judge name tooltips. Framer Motion does not provide focus accessibility for tooltips.

**`@radix-ui/react-dialog`** — accessible modal for the post-vote reveal pop-up. Provides focus trap and escape key handling.

**`canvas-confetti`** — already listed as installed. Used once: the post-vote reveal moment.

**Do not install:** react-type-animation (implement the typing effect with `useEffect` + `setInterval` — it is 15 lines), lottie-react (the crown icon is an SVG, not a Lottie animation), react-intersection-observer (Framer Motion `whileInView` replaces it).

---

## Success Criteria

A build passes when:

- Leaderboard rows animate to new positions without any row jumping or snapping
- Score numbers roll to new values rather than snapping
- The voting lock button transitions through dormant → hover → active → submitting → confirmed without any visual jump
- Episode cards flip on hover with convincing 3D depth
- All animations pause under `prefers-reduced-motion`
- No broken images anywhere on the scoreboard or voting pages
- Typing effect fires once per session on the homepage hero and does not repeat on refresh within the same session
- All buttons site-wide share the same glow system — no one-off inline shadow values
- 60 FPS maintained during leaderboard resorting with 20+ rows
- Lighthouse Accessibility score ≥ 90
- Every interactive element reachable and usable by keyboard alone

---

## Component Map

| Component | Primary change | Priority |
|---|---|---|
| `globals.css` | Three fonts, border system, button classes, `backface-hidden`/`perspective`/`preserve-3d` utilities, focus ring | P0 |
| `SplitFlapScoreboard.js` | Rajdhani for all numbers | P0 |
| `LiveScoreboard.js` (new) | Framer Motion FLIP layout, row reorder, score roll, rank badges | P0 |
| `ScoreboardRow.js` (new) | Single FLIP row with rank change highlight | P0 |
| `LiveVoting.js` | Rajdhani digits, ghost score preview, lock button states, crowd strip | P0 |
| `ScrollDigit.js` | Center band upgrade, selection flash, Rajdhani font | P0 |
| `app/page.js` | Remove controversy element from top; add FeaturedEpisodeSection | P0 |
| `FeaturedEpisodeSection.js` (new) | Mini scoreboard + community feed split panel | P0 |
| `ContestantCard.js` | Fix broken images with Next.js Image | P0 |
| `EpisodeFlipCardGallery.js` (new) | 3D flip with Framer Motion rotateY | P1 |
| `ImageUploadZone.js` (new) | react-dropzone, preview, validation | P1 |
| `AdminDashboardClient.js` | Add upload zones to contestant + judge forms | P1 |
| `api/admin/upload/[type]/route.js` (new) | sharp resize, fs write to public folder | P1 |
| `CurtainHero.js` | Canvas particles, CSS spotlights; replaces static bg image | P2 |
| `JudgePanel.js` | Float animation, Radix tooltip | P2 |
| Community compose | Cycling placeholder typing effect | P2 |
| All buttons site-wide | Single-pass btn-primary / btn-ghost / btn-danger class application | P2 |
