# SEO & Custom-Domain Deploy

This site is search-engine optimised **without any frontend/UI changes**. All SEO
lives in `<head>` tags, JSON-LD `<script>` blocks, `robots.txt`, `sitemap.xml`,
and a web manifest — none of it renders into the visible page.

## 1. Set your domain (one env var)

Everything canonical/sitemap/robots/Open-Graph is driven by a single variable so
the same build works on any domain:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.tld
```

- No trailing slash needed (it's normalised in `src/lib/seo.js`).
- If unset, it falls back to `https://aftertheact.in`. **Set it to your real
  domain before going live**, otherwise canonical URLs and the sitemap point at
  the fallback.

### On Vercel
1. Project → **Settings → Environment Variables** → add `NEXT_PUBLIC_SITE_URL`
   for the **Production** (and Preview, if you want) environment.
2. Project → **Settings → Domains** → add your custom domain and follow the DNS
   instructions (A record `76.76.21.21` for the apex, or CNAME for `www`).
3. Pick one canonical host. If you serve both `www` and apex, set
   `NEXT_PUBLIC_SITE_URL` to the one you want indexed and let Vercel redirect the
   other to it (Vercel does this automatically when you mark a primary domain).
4. Redeploy so the new env var is baked in.

## 2. What was added (all invisible)

| File | Output | Purpose |
|------|--------|---------|
| `src/lib/seo.js` | — | Central site config + metadata/JSON-LD helpers |
| `src/app/layout.js` | `<head>` + JSON-LD | `metadataBase`, title template, keywords, Open Graph, Twitter card, robots, Organization + WebSite structured data |
| `src/app/robots.js` | `/robots.txt` | Allows crawling, blocks `/admin`, `/api`, auth/personal routes, links sitemap |
| `src/app/sitemap.js` | `/sitemap.xml` | Static public routes + every non-archived episode (revalidates hourly) |
| `src/app/manifest.js` | `/manifest.webmanifest` | PWA/share metadata using existing brand colours |
| Per-page `metadata` | `<head>` | Self-referencing `canonical` on every public page; `noindex` on login/onboarding/profile/admin/voting-wheel |

Per-page canonicals are set on each page (not in the root layout) because an
`alternates.canonical` on the root layout is inherited by all children and would
point every route at `/`.

## 3. Post-deploy checklist

1. Visit `https://your-domain/robots.txt` and `https://your-domain/sitemap.xml`
   — confirm they show your domain.
2. View-source on the homepage → confirm `<link rel="canonical">`,
   `og:` / `twitter:` tags, and two `application/ld+json` blocks are present.
3. Add the property in **Google Search Console**, verify, and submit
   `https://your-domain/sitemap.xml`.
4. (Optional) Add a Bing Webmaster Tools property and submit the same sitemap.
5. Test a share preview with the
   [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and
   [Twitter Card Validator] — they should pull the logo + description.

## 4. Optional next step

The Open Graph image currently reuses `/public/logo.png`. For sharper social
cards, drop a dedicated 1200×630 image and point `OG_IMAGE.url` in
`src/lib/seo.js` at it (or add a file-based `src/app/opengraph-image.png`).
