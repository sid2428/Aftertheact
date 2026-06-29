# Fix Asset Caching: Eliminate Stale 404s, Save Egress, Boost Perceived Performance

## The Problem

Your current caching has **three root-cause bugs** and the video issue you flagged is a **fourth**:

### Bug 1: Cached 404s That Never Self-Heal
`/uploads/:path*` header is `public, max-age=300, must-revalidate`. When a DB row references a file that doesn't exist yet (or is being replaced), the browser caches the **404 response** for 5 minutes. Once cached, the user sees a broken image until expiry.

### Bug 2: The `?v=2` Cache-Bust Is a Brittle Dead-End
The `ASSET_V` constant in `panel.js` is a global, manually-bumped version that doesn't auto-increment per-image. Every judge shares `?v=2`, so replacing one photo doesn't bust the cache for that specific image.

### Bug 3: No Error Handling on `<img>` Tags
Bare `<img>` tags across the codebase have **zero** `onError` handling. If an image fails to load, the browser shows a broken icon forever.

### Bug 4: Intro Videos Not Cached + Fail-Once-Skip-Forever 🔥
**This is why your vertical video breaks.** Two problems:
- **`vertical.mp4` and `Horizontal.mp4` are missing from the cache header pattern** in [next.config.mjs](file:///c:/Users/thang/Downloads/Aftertheact/next.config.mjs#L48). The pattern only lists `intro.mp4|latent_viral_clip.m4a`. These ~2.6MB videos get `max-age=0` — **re-downloaded from scratch every visit**. On mobile/slow connections this often fails or times out.
- **`onError={finish}` in [IntroSequence.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/IntroSequence.js#L114)** — when the video fails to load, it immediately calls `finish()`, skipping the intro permanently. No retry, no second chance. The user just sees a black screen that fades away.

---

## Proposed Changes

### 1. Cache Headers — The Core Fix

#### [MODIFY] [next.config.mjs](file:///c:/Users/thang/Downloads/Aftertheact/next.config.mjs)

**a) Uploads → immutable (UUID-addressed, content never changes at same URL):**
```diff
-{ key: "Cache-Control", value: "public, max-age=300, must-revalidate" }
+{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }
```

**b) Brand assets → add the missing video files:**
```diff
-"/:asset(bluecurtains-bg.png|curtains-left.png|curtains-right.png|logo.png|intro.mp4|latent_viral_clip.m4a)"
+"/:asset(bluecurtains-bg.png|curtains-left.png|curtains-right.png|logo.png|intro.mp4|vertical.mp4|Horizontal.mp4|latent_viral_clip.m4a)"
```

**c) Tighten stale-while-revalidate on brand assets:**
```diff
-"public, max-age=604800, stale-while-revalidate=2592000"
+"public, max-age=604800, stale-while-revalidate=604800"
```

**d) Add `minimumCacheTTL` for next/image optimization:**
```js
images: {
  minimumCacheTTL: 31536000, // 1 year — safe because upload URLs are content-addressed (UUID)
  // ...existing localPatterns, remotePatterns
}
```

---

### 2. Fix Intro Video: Retry on Error

#### [MODIFY] [IntroSequence.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/IntroSequence.js)

Replace the bare `onError={finish}` with a retry mechanism:
- On first error, wait 1.5s, then reload the video (append `?_retry=1` to bust any edge-cached error)
- On second error, give up and call `finish()` (graceful degradation)
- This handles the common case: mobile user on spotty connection, first fetch fails, retry succeeds from a closer CDN edge

---

### 3. Remove the Manual Cache-Bust System

#### [MODIFY] [panel.js](file:///c:/Users/thang/Downloads/Aftertheact/src/lib/panel.js)

- Delete `ASSET_V`, `bustImage()`, `stripVersion()`
- Remove the `bustImage`/`stripVersion` mappings from `getPanelMembers()`/`setPanelMembers()`
- Clean up the dead comment block

---

### 4. Add Resilient Image Component

#### [NEW] [ResilientImg.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/ResilientImg.js)

A drop-in `<img>` replacement that:
1. **Retries once on error** — waits 2s, retries with `?_retry=1` cache-buster
2. **Shows a graceful fallback** — renders first letter of alt text in a styled placeholder
3. Prevents permanently-broken images on transient failures

---

### 5. Replace Bare `<img>` Tags with `ResilientImg`

#### [MODIFY] [JudgePanel.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/JudgePanel.js) (line 111)
#### [MODIFY] [LineupPosters.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/LineupPosters.js) (line 17)
#### [MODIFY] [ScoreboardHero.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/ScoreboardHero.js) (line 96)
#### [MODIFY] [VotingSection.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/VotingSection.js) (line 76)
#### [MODIFY] [CommunityPageClient.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/CommunityPageClient.js) (line 98)
#### [MODIFY] [judges-scoreboard/page.js](file:///c:/Users/thang/Downloads/Aftertheact/src/app/judges-scoreboard/page.js) (line 49)
#### [MODIFY] [JudgePageClient.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/JudgePageClient.js) (line 227)

Replace `<img src={dynamicUrl} ...>` → `<ResilientImg src={dynamicUrl} ...>` for user-uploaded/dynamic content only. Static assets (`/logo.png`, curtains) stay as `<img>`.

---

## Summary of All Changes

| File | Change |
|------|--------|
| [next.config.mjs](file:///c:/Users/thang/Downloads/Aftertheact/next.config.mjs) | `immutable` on uploads, add missing videos, add `minimumCacheTTL` |
| [IntroSequence.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/IntroSequence.js) | Video retry on error instead of skip |
| [panel.js](file:///c:/Users/thang/Downloads/Aftertheact/src/lib/panel.js) | Remove `bustImage`/`stripVersion`/`ASSET_V` dead code |
| [ResilientImg.js](file:///c:/Users/thang/Downloads/Aftertheact/src/components/ResilientImg.js) | **[NEW]** Error-resilient `<img>` wrapper |
| 7 component/page files | Use `ResilientImg` for dynamic images |

## Verification Plan

### Build Check
- `npm run build`

### Manual Verification
1. Deploy to preview → DevTools Network → verify `/uploads/` has `immutable`, `/vertical.mp4` has `max-age=604800`
2. Throttle network to Slow 3G → load site on mobile viewport → verify video retries and plays
3. Update a judge photo in admin → verify new UUID URL loads, old one is no longer referenced
4. Block an image URL in DevTools → verify ResilientImg shows fallback letter, not broken icon
