# AfterTheAct — SEO & Launch Playbook

Goal: organic reach + a trusted link footprint so shares don't get flagged as spam.
Framing decision: **balanced / nominative** — "unofficial fan community for India's Got
Latent", always with the not-affiliated disclaimer. Do not claim to be official.

> Reality check: **SEO does not produce 20k users in a week for a new domain.** Google
> sandboxes new sites 3–8 weeks. The 20k comes from **social distribution** (IG/YT/X +
> WhatsApp/Reddit) using the share cards below. SEO is the trust + long-tail layer that
> makes those shares convert and keeps compounding after week one.

---

## 1. What was implemented in code (already done, deploy to activate)

- **Title tags rewritten** to lead with real search terms ("India's Got Latent
  Scoreboard/Episodes/Leaderboard/Judges") — brand phrases ("The Verdict Board", "The
  Green Room", etc.) kept in the descriptions. Titles are the #1 on-page ranking factor.
- **Title template** `%s | AfterTheAct` + keyword-rich homepage title.
- **`keywords`, `robots: max-image-preview:large`** for richer snippets.
- **Structured data**: site-wide `WebSite` + `Organization` (logo, `about: India's Got
  Latent`); per-episode `TVEpisode`. Enables rich results / knowledge panel.
- **Dynamic `sitemap.xml`** now lists every non-archived episode, not just static pages.
- **Social share cards** (`opengraph-image`): a branded 1200×630 default + a **unique
  per-episode card**. This is the single biggest lever for WhatsApp/IG/Reddit shares —
  rich, unique previews read as real content, bare/duplicate ones read as spam.

Zero visible UI changes. Nothing from prior work deleted.

**After deploy, pre-warm the OG cache** (otherwise first share shows a blank preview):
- Meta (WhatsApp/IG/FB): https://developers.facebook.com/tools/debug/ → paste each URL → "Scrape Again"
- X/Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

---

## 2. Cloudflare (free plan) settings

Dashboard → your domain. I cannot change these from the repo — do them manually.

**SSL/TLS**
- Mode: **Full (strict)** — never "Flexible" (causes redirect loops + insecure origin).
- Edge Certificates → **Always Use HTTPS: On**, **Automatic HTTPS Rewrites: On**,
  **Minimum TLS 1.2**.
- **HSTS: On** (max-age 6 months, includeSubDomains) — only once HTTPS is confirmed solid.

**Caching** (this is where the past image-404 bug lived — be conservative)
- Configuration → **Browser Cache TTL: Respect Existing Headers.** Let Next/Vercel
  control caching. Do **not** use "Cache Everything" — this is a dynamic app.
- **Tiered Cache: On.** **Crawler Hints: On** (helps search bots crawl efficiently).
- If images 404 again: purge by prefix `/uploads/` (Caching → Purge Cache).

**Network**
- **HTTP/3 (QUIC): On**, **0-RTT: On**, **WebSockets: On**, **IPv6: On**.

**Bots — IMPORTANT for your share strategy**
- **Bot Fight Mode: OFF** for launch. It can challenge social preview crawlers
  (`facebookexternalhit`, `WhatsApp`, `Twitterbot`, `Slackbot`, `Discordbot`, `TelegramBot`)
  which are *not* on Cloudflare's verified-bot list → broken link previews = looks like
  spam. Googlebot/Bingbot are verified and pass, but the social ones are the ones you're
  relying on. Leave it off until you have traffic to protect.

**Security**
- Security Level: **Medium** (not High — High over-challenges real users and crawlers).
- **Under Attack Mode: OFF** (only during an actual DDoS; it blocks all crawlers).

**Scrape Shield**
- Email Obfuscation: On. **Hotlink Protection: OFF** (it blocks social crawlers from
  fetching your og:image).

**Redirect Rule (canonical host — do this, it matters for SEO)**
- Rules → Redirect Rules → new rule:
  - When incoming host equals `aftertheact.com` → **301** to
    `https://www.aftertheact.com/${...path}` (preserve path + query).
- Your code canonical is **www**. Make Vercel agree: Vercel → Domains → set
  `www.aftertheact.com` as **Primary** so apex→www redirect direction matches (no loop).

**Analytics (bonus, free)**
- Enable **Cloudflare Web Analytics** (cookieless) as a second signal next to GA4.

---

## 3. Google Search Console (do on day 1)

1. Use a **Domain property** for `aftertheact.com` (covers www + apex) — DNS TXT verify.
2. **Submit sitemap**: `https://www.aftertheact.com/sitemap.xml`.
3. URL Inspection → **Request Indexing** for `/`, `/episodes`, `/scoreboard`, `/panel`,
   and the current live episode. Repeat for each new episode.
4. Add the site to **Bing Webmaster Tools** (import from GSC — 2 clicks, free traffic).

---

## 4. Trust signals so social filters don't flag you as spam

- **One canonical host everywhere** (www) — done in code + the CF redirect above.
  Mixed apex/www links dilute ranking and look sketchy.
- **Never share via URL shorteners** (bit.ly etc.) — Meta/WhatsApp flag them. Share full
  `https://www.aftertheact.com/...` links; your OG cards make them look good anyway.
- **Warm up the domain — do NOT blast.** Posting the same link hundreds of times in an
  hour across WhatsApp/Meta trips spam detection and can get the domain blocked. Stagger
  over days, vary the URL (per-episode links differ), seed from multiple communities.
- Keep the **"unofficial / not affiliated"** disclaimer visible (already in footer) —
  prevents impersonation/trademark takedowns and platform flags.
- Fill in real **social profiles** once live and add them to `sameAs` in the Organization
  JSON-LD (`src/app/layout.js`) — consistent identity across the web is a trust signal.

---

## 5. The distribution plan (the actual 20k)

You have the channels (IG/YT/X + WhatsApp/Reddit). Sequence for a launch week:

1. **Pre-warm OG** for every URL you'll share (section 1).
2. **Anchor to a live episode.** Traffic spikes around a fresh/trending episode — launch
   the push when one is LIVE so "vote now" has urgency.
3. **Post native, link secondary.** IG/YT/X: post a screenshot of the scoreboard or a
   verdict card as the content; put the link in bio/first comment. Algorithms suppress
   posts that are just outbound links.
4. **Reddit**: r/IndiasGotLatent, r/samayraina, r/IndianDankMemes and similar — lead with
   a genuinely interesting result/poll, link where the sub allows. Value first, not spam.
5. **WhatsApp**: share **per-episode** links (each has a unique preview), not the homepage
   on repeat. Ask 5–10 people to reshare rather than you mass-posting from one number.
6. **Build the loop**: after someone votes, prompt them to share their result card. You
   already have a `generate-cards` cron — wire the share button to it. This is what turns
   1 visitor into 3 and is worth more than any meta tag for hitting 20k.

---

## 6. Follow-ups (not done — highest ROI next)

- **Per-judge pages** (`/judge/[slug]`) indexable with bios/ratings — judge-name searches
  ("rate Samay Raina") are high-volume. Routes don't exist yet; ~half a day of work.
- **Share button → result card** on the vote flow (item 5.6) — the real growth engine.
- Add real social `sameAs` links to the Organization JSON-LD once accounts are live.
