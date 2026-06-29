---
name: add-episode-photos
description: Use when adding contestant photos to an episode that already exists in the database, from a seed folder of images (e.g. "upload the s03e02 contestant photos", "add the photos from seed/S03E02"). Repoints each contestant's image_url to a local /uploads file.
---

# Add Episode Photos

## Overview

Contestant photos are stored as **local files** under `public/uploads/contestants/`
and referenced by `Contestant.image_url` (a `/uploads/...` path). This is local file
storage — NOT Supabase object storage. The episode and its contestants already exist
in the DB; this skill only attaches the images.

## When to Use

- You have an episode already created in the DB with its contestants linked.
- You dropped photos into a seed folder named `seed/S<season>E<episode>/` (e.g. `seed/S03E02/`).
- Each image is named after the contestant (`avinash-agarwal.png`, `sukrut-deo.jpg`, …). Exact slug not required — close-enough names fuzzy-match.

## Steps

1. Put the images in `seed/S0xE0y/` (one per contestant, named after them).
2. **Preview** the match (no writes):
   ```
   node .claude/skills/add-episode-photos/add-photos.mjs S03E02 --dry
   ```
3. Read the report. Every contestant should show a `MATCH`. If a file shows `??` or a
   contestant shows `(no file for …)`, rename the file to that contestant's name and re-run `--dry`.
4. **Apply**:
   ```
   node .claude/skills/add-episode-photos/add-photos.mjs S03E02
   ```
   This copies each file to `public/uploads/contestants/<contestant-slug><ext>` and sets `image_url`.
5. **Commit** `public/uploads/contestants/` and any code — files must be deployed before being referenced, or the CDN caches a 404 for them.

The episode token is flexible: `S03E02`, `s3e2`, `3x2` all parse. Pass a custom folder as the 2nd arg if it isn't `seed/S0xE0y/`.

## How matching works

The seed filename is slugified and compared to each contestant's name (their DB slug
minus its trailing `-12345` suffix): exact, then prefix, then fuzzy (edit distance ≤ 2,
so typos like `sukurut` → `Sukrut` still match). Each file claims one contestant.

## Rendering note (LIVE episodes)

A LIVE episode renders through the voting wheel (`VotingScoreWheel.js` → `ActCard`),
which shows `act.imageUrl` if present, else the initial letter. `image_url` is threaded
LIVE-branch map in `episode/[id]/page.js` → `VotingWheelPageClient` → `VotingScoreWheel` → `ActCard`.
If photos don't appear on a live episode, confirm `imageUrl` is still passed through all four hops.

## Common Mistakes

- **Photos uploaded but not visible** → usually a rendering gap, not the upload. Verify with the dry run that `image_url` is set, then check the four-hop passthrough above.
- **404 on the image after deploy** → the file wasn't committed/deployed before being referenced; commit `public/uploads/contestants/` and purge the CDN cache if needed.
- **`No episode … found`** → the episode or its `ContestantEpisodeAppearance` rows don't exist yet. Create the episode and link contestants first.
