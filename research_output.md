# After the Act — Market Demand Research Report

*Prepared for the After the Act team (https://aftertheact.vercel.app)*
*Research date: June 2026 · Subject: India's Got Latent (IGL) fan voting platform*

> **A note on data reliability before you read.** This report is built from live web search.
> Where a number is solid and corroborated, it is stated plainly. Where it comes from a
> single source, a real-time tracker that fluctuates, or an estimate, it is labelled as such.
> Several 2026-dated figures (especially Season 2 viewership) come from individual articles and
> should be re-verified directly before being used in a pitch deck or investor document.
> **No numbers in this report were invented** — gaps are called out explicitly.

---

## Executive Summary

- **The fan base is massive and measurable.** Samay Raina commands roughly **8.7–9M YouTube subscribers** and **~9–10M Instagram followers**, and IGL episodes routinely pull **20–45M views each**. Season 1 reportedly accumulated **~364M total views**. This is one of the largest single-show fan communities on Indian YouTube.
- **Fans already rank and rate contestants themselves — informally.** There is a public **TierMaker "IGL Contestants Tier List,"** active Reddit debate about whether judging is "scripted/unfair," and documented "second-screen" behaviour where viewers flood social media to follow contestants the moment they perform. The *behaviour* After the Act monetises already exists; it just has no home.
- **There is no direct competitor — including from the official side.** The **official IGL app (built by Samay Raina) has NO fan voting, rating, or leaderboard.** The closest analogues are the enormous ecosystem of **unofficial Bigg Boss voting sites** (proof the model works in India) and **K-pop voting apps** (Choeaedol/Mubeat, ~8M downloads each — proof it scales globally).
- **Distribution conditions are unusually favourable right now.** Samay Raina has publicly stated there are **no copyright strikes on IGL Season 2 clips**, actively inviting reaction/ranking content. A "rank the contestants / did the judges get it right?" creator wave is essentially pre-authorised — the perfect carrier for a leaderboard site.
- **The biggest risk is single-show dependency and IP.** IGL has already been pulled offline once (the Feb 2025 obscenity controversy) and Season 3 is unconfirmed. After the Act is exposed to the show's volatility and to a possible trademark/takedown letter for using the IGL name.

---

## Overall Demand Verdict

### **PROMISING BUT NOT YET PROVEN (leaning positive)**

The *audience* and the *latent behaviour* are validated beyond reasonable doubt. The community is large (8M+ across platforms), highly engaged, and already performs the exact actions After the Act is built around — ranking contestants, arguing about judge scores, and migrating to second-screen platforms after each episode. Critically, **no one — not even the show's own official app — currently offers a structured fan-voting and leaderboard product**, so After the Act is entering genuinely open space rather than fighting for share. The adjacent precedents (Bigg Boss unofficial voting sites in India; K-pop voting apps globally) confirm that fan-voting products in this exact shape attract real, recurring traffic and can be monetised.

What is *not* yet proven is **conversion** — that this diffuse, comment-section energy will convert into repeat visits to a destination website, and that After the Act specifically can capture it. Demand for "voting" as a behaviour is High; demand for "After the Act the website" is unmeasured because the product is new and has no public traction data yet. The honest verdict is therefore *promising but unproven*: the market clearly exists, the gap is real, the timing (no-copyright-strike reaction wave) is excellent, but the team must now run a cheap live test (one episode cycle) to prove fans will actually show up and vote. The risk is not "is there an audience" — it's "single-show dependency, IP exposure, and unproven conversion."

---

## Task 1: Audience Size & Fan Base

```json
{
  "youtube_samay_raina": {
    "subscribers": "8.7M–9M (varies by tracker; HypeAuditor ~8.72M May 2026, some sources ~9M)",
    "avg_views_per_IGL_episode": "20M–45M (S1 avg 20M+; S2 ep1 ~32M in one day, ~45M in four days)",
    "total_views_IGL": "Season 1 ~364M total; Season 2 projected ~360M",
    "peak_concurrent_live_viewers": null,
    "peak_note": "Not found as a published figure. Proxy: S2 ep1 crossed 15M views within hours of release."
  },
  "episodes": {
    "season_1": "12 main episodes (+6 bonus per one source); made private Feb 2025",
    "season_2": "Launched June 20, 2026; new episodes ~every two weeks; simulcast YouTube + Netflix",
    "total_aired_approx": "13+ (S1) plus ongoing S2"
  },
  "instagram_samay_raina": {
    "handle": "@maisamayhoon",
    "followers": "~9M–10M (news9/qoruz range; ~9.2M Apr 2026)"
  },
  "twitter_x_samay_raina": {
    "handle": "@ReheSamay",
    "followers": "60 lakh+ (~6M) cited by News9; exact current count not confirmed"
  },
  "reddit": {
    "dedicated_subreddit_members": null,
    "note": "No clear member count surfaced for an IGL-specific subreddit; discussion is spread across r/india, r/IndianYouTube and general threads. Treat as fragmented (see Task 7)."
  },
  "discord": {
    "members": null,
    "note": "No official/large fan Discord surfaced. A 'Discord's Got Latent' YouTube live format exists but is not a measurable community server."
  },
  "google_trends_interest": {
    "status": "High and culturally significant",
    "evidence": "'Latent' / 'Latent meaning' featured in Google India's Year in Search 2025; sustained national-trend status. Exact 12-month curve not extracted."
  }
}
```

**What this means for After the Act:** The total addressable community is comfortably in the **millions** (8M+ YouTube subs is the anchor number). Even capturing a fraction of one percent of per-episode viewers (20M+) as voters would be a meaningful user base. The main caveats: peak-concurrent and Reddit/Discord membership numbers could not be pinned down, and the community is **spread across platforms** rather than concentrated in one (a distribution challenge, addressed in Task 5 and Task 7).

---

## Task 2: Fan Engagement & Unmet Demand (Social Listening)

The goal was qualitative proof that fans want to rank/rate contestants and judges themselves. Search surfaced strong signals, though several individual quote-level results were thin. Concrete evidence found:

1. **TierMaker — "India's Got Latent Contestants Tier List"** (tiermaker.com/create/indias-got-latent-contestants-...). Fans are *already* building DIY ranking tools. This is the single most direct proof of unmet ranking demand.
2. **"Scripted / sanitized" backlash on Reddit (S2 ep1):** Fans complained the new season traded raw comedy for "PR-friendly banter" and "manufactured" audience reactions — i.e. fans are actively scrutinising and contesting how the show is run/judged. (altbollywood.com review aggregating Reddit sentiment.)
3. **Judge-quality debate is a content genre:** e.g. YouTube "Most Hated Vs Most Loved Judges in India's Got Latent" — fans openly rank judges, which is exactly the After the Act "rate the judges" feature.
4. **"Did the judges get it right?" framing around the perfect-10 win:** Avinash Agarwal's perfect-10 for a Trump impression generated debate — the kind of score that fan-voting platforms exist to relitigate.
5. **Second-screen migration is documented with hard numbers** (Storyboard18 / Qoruz): Avinash Agarwal +235K followers (+1,175%) and Sukrut Deo +185K (+370%) immediately after one episode. Fans don't just watch — they act, follow, and engage right after performances.
6. **Republic World "people who went viral after IGL"** — ongoing fan interest in tracking and elevating specific contestants (Keshav Jha, "Sharon from Bihar," etc.).
7. **X reaction roundups** (Sunday Guardian: "S2 X Reactions: Hit or Miss?") — fans publicly grading the show and panel in real time.
8. **Quora threads** debating the show, judges and controversy — sustained Q&A-style engagement.
9. **An official IGL app exists with 3.1k ratings at 4.5★** — demonstrates fans will download dedicated IGL destinations (but it has no voting; see Task 3).
10. **Buzz-in-Content / Gen-Z fandom report:** Indian Gen Z fandoms are "running voting campaigns, remixing trailers, organising meet-ups"; **83% describe themselves as creators, not just consumers** — structurally primed for a participatory product.

**Demand signal rating: HIGH.**

*Justification:* The behaviours After the Act sells — ranking contestants, debating judge fairness, and tracking who "deserved more" — are demonstrably happening in the wild (TierMaker lists, judge ranking videos, scripted/unfair backlash, viral-contestant tracking, second-screen follower spikes). What holds it back from "Very High" is that this energy is currently **diffuse and improvised** (comments, tweets, one-off tier lists) rather than expressed as demand for a single voting destination — meaning demand for the *behaviour* is High, but demand for a *dedicated platform* is inferred, not yet directly measured.

---

## Task 3: Competitor & Gap Analysis

### Competitor comparison table

| Platform / type | What it is | Fan vote on contestants? | Fan rate judges? | Leaderboard? | Relevance to After the Act |
|---|---|---|---|---|---|
| **Official IGL app** (by Samay Raina) | Official content/video app, 4.5★, ~3.1k ratings | ❌ No | ❌ No | ❌ No | **Direct space is open even officially** — strongest evidence of the gap |
| **Show's built-in format** | Self-rating vs judge panel average | ❌ (judges only) | ❌ | ❌ | The on-air mechanic *creates* the disagreement After the Act resolves |
| **TierMaker IGL tier list** | DIY drag-and-drop ranking | ⚠️ Manual/static | ❌ | ❌ | Closest substitute fans use today; proves ranking demand |
| **Reddit / X / YouTube comments** | Informal debate & polls | ⚠️ Ad hoc | ⚠️ Ad hoc | ❌ | Fragmented substitute; no persistence or aggregation |
| **Unofficial Bigg Boss voting sites** (bbonlinevote.in, bigg-boss-vote.in, etc.) | Whole industry of fan-run voting/result sites | ✅ Yes | ❌ | ✅ Trends | **Adjacent proof the model works & monetises in India** |
| **K-pop apps** (Choeaedol, Mubeat, IdolChamp, Podoal) | Global fan voting + leaderboards | ✅ Yes | n/a | ✅ Yes | **Global proof it scales** (~8M downloads each) + monetisation playbook |
| **After the Act** | Fan voting on contestants **and** judges + 3 leaderboards/scoreboard | ✅ Yes | ✅ **Yes (unique)** | ✅ Yes | The only product combining all of the above for IGL |

### Gap summary

**A direct competitor does not exist (Yes-gap confirmed).** No website, app, or bot was found that lets IGL fans vote on contestants and judges with leaderboards. Most tellingly, the **official IGL app — built by the show's own creator — has none of these features**, so After the Act is not even competing against an official incumbent. The space is genuinely empty.

**The closest substitutes fans use today are improvised and fragmented:** a TierMaker tier list (static, manual, no aggregation), scattered Reddit/X polls, and comment-section arguments. None of these persist across episodes, none aggregate into a community-wide ranking, and none let fans grade the *judges* — which is After the Act's most differentiated feature and one with clear demonstrated appetite ("most loved vs most hated judges" content, "judges were unfair" sentiment).

**The precedents that de-risk the model are adjacent, not direct.** In India, the sprawling ecosystem of unofficial **Bigg Boss voting sites** proves that fans will reliably visit third-party, non-official voting destinations week after week (with traffic surging near deadlines) — even when those votes "don't officially count." Globally, **K-pop voting apps** (Choeaedol, Mubeat at ~8M downloads each) prove the leaderboard-plus-voting format scales to millions and sustains a real monetisation engine. After the Act is essentially "Bigg Boss-voting-site reliability × K-pop-app feature depth, aimed at the IGL fandom, plus a judge-rating layer nobody else offers." The opportunity is real; the unproven part is execution and capturing attention, not the existence of demand.

---

## Task 4: Search & Keyword Demand

Exact monthly search volumes for India are **not reliably available without a paid keyword tool**, and live search did not surface a credible per-keyword volume table. The figures below are therefore marked as proxy-signal assessments based on news coverage, autocomplete/related-query behaviour, and the show's documented cultural prominence — **not precise numbers.** Treat the "volume" column as directional.

| Keyword | Search Volume (Monthly, India) | Trend |
|---|---|---|
| India's Got Latent | Data unavailable — proxy: **Very High** (Google India "Year in Search 2025" trend; tens of millions of episode views) | Growing (spiked again with S2, June 2026) |
| India's Got Latent contestants | Data unavailable — proxy: **High** (viral-contestant articles; Storyboard18/Republic coverage) | Growing |
| India's Got Latent judges | Data unavailable — proxy: **Medium–High** ("loved vs hated judges" content exists) | Stable/Growing |
| India's Got Latent vote | Data unavailable — proxy: **Low–Medium** (no official voting exists to search for — *this is opportunity, not absence of interest*) | Unknown |
| India's Got Latent leaderboard | Data unavailable — proxy: **Low** (SERP effectively empty — strong SEO opening) | Unknown |
| India's Got Latent results | Data unavailable — proxy: **Medium** (episode-outcome curiosity) | Episodic spikes |
| India's Got Latent ranking | Data unavailable — proxy: **Medium** (TierMaker lists, ranking videos) | Growing |
| Samay Raina show | Data unavailable — proxy: **High** (8M+ sub creator) | Stable/Growing |
| Samay Raina India's Got Latent | Data unavailable — proxy: **High** | Growing |
| latent show voting | Data unavailable — proxy: **Low** | Unknown |

**SEO opportunity assessment.** The most strategically important finding is what is *missing* from search results: queries like **"India's Got Latent leaderboard"** and **"India's Got Latent fan vote"** return **no dedicated ranking/voting page** — the SERP is essentially empty of purpose-built competitors. For a high-prominence show ("Latent" was a national Year-in-Search trend) with tens of millions of viewers and *zero* incumbent ranking pages, this is a textbook first-mover SEO opening. After the Act should create dedicated, well-structured pages targeting "India's Got Latent leaderboard / contestants ranking / vote / results," refreshed every episode, to own these terms before anyone else does. The caveat: "...vote" and "...leaderboard" volumes are likely low *today* precisely because the behaviour has no destination — After the Act would be partly *creating* the search demand it then captures, which is higher-effort than harvesting existing volume.

---

## Task 5: Creator & Influencer Distribution Potential

### Ranked top distribution opportunities

The single biggest enabler found: **Samay Raina has publicly confirmed there are no copyright strikes on IGL Season 2 clips**, explicitly inviting creators to make reaction, review, and ranking content. This removes the usual friction and makes a "rank the contestants / grade the judges" creator wave essentially pre-authorised — ideal terrain for a leaderboard site to ride.

| # | Opportunity | Platform | Reach (approx) | Why relevant |
|---|---|---|---|---|
| 1 | **Samay Raina himself** | YT/IG/X | ~8.7–9M / ~9–10M / ~6M | A single mention could drive a launch-day surge (see estimate below). Highest-leverage, lowest-probability. |
| 2 | **IGL judges/panelists** (Tanmay Bhat, Rohan Joshi, etc.) | YT/IG/X | Millions each | Native credibility; a judge sharing a "rate the judges" page is irresistible content |
| 3 | **Reaction/ranking YouTubers** (genre now copyright-safe) | YouTube | Varies | "Ranking ALL IGL contestants" / "Did the judges get it right?" formats map 1:1 to the product |
| 4 | **Viral ex-contestants** (Avinash Agarwal +235K, Sukrut Deo +185K, Keshav Jha, "Sharon from Bihar") | IG/YT | 100K–250K+ and rising | Personal incentive to share a leaderboard that ranks them highly |
| 5 | **IGL commentary/clip pages** | IG/X | Varies | Already repackage IGL moments; a leaderboard is shareable native content |
| 6 | **r/india, r/IndianYouTube + IGL threads** | Reddit | Large but fragmented | Discussion-native; good for seeding ranking debates |
| 7 | **Co-watch / live-reaction streamers** | YouTube Live | Varies | Real-time voting overlay during episodes is a natural fit |
| 8 | **TierMaker / ranking-tool audiences** | Web | Niche but intent-rich | Already ranking IGL contestants manually — direct conversion target |
| 9 | **Quora IGL question topics** | Quora | Long-tail | Captures "is there a way to vote on IGL?" intent |
| 10 | **General Indian Gen-Z fandom channels** | Mixed | Broad | 83% self-identify as creators; structurally inclined to participate/share |

*Note: specific creator-by-creator subscriber/engagement numbers for dedicated IGL reaction channels were not individually verified in search; rows 3–10 are by category. This is a gap worth closing with a manual creator list before outreach.*

### Shoutout impact estimate (reasoned, not a published case study)

A published Indian fan-site shoutout case study was **not found**, so these are reasoned estimates, clearly labelled as such:
- **A 500K-subscriber creator shoutout:** realistically a few thousand to low-tens-of-thousands of Day-1 visits (rough planning band: ~2,000–20,000), depending on placement (dedicated video vs. passing mention), call-to-action strength, and timing relative to a fresh episode. Treat as an order-of-magnitude planning figure, not a forecast.
- **Samay Raina himself mentioning the site:** potentially a step-change — plausibly **hundreds of thousands** of Day-1 visits given his 8M+ reach and the audience's demonstrated willingness to download/visit IGL destinations (the official app already has 3.1k ratings). This is the "make-or-break" distribution lever and should be a deliberate, long-term relationship goal — while building so the platform does **not** depend on it.

### Community channels

No large official/fan **Discord, WhatsApp, or Telegram** community for IGL surfaced with a verifiable member count. This is itself a finding: the fandom is **platform-fragmented** (YouTube comments, Reddit, X, Instagram) rather than concentrated in an ownable community hub — which is both a distribution challenge *and* an opening for After the Act to become that missing central hub.

---

## Task 6: Monetization Benchmarks

### Indian ad market context (the key input)
- **YouTube CPM, India, entertainment niche:** roughly **₹80–₹150** per 1,000 views; entertainment is one of the *lower* niches (finance/tech earn 2–3× more). Display-ad CPMs are lower still (~₹10–₹35). After-creator-cut RPM for entertainment is ~₹40–₹80.
- **Reference point from IGL itself:** the Season 1 sponsorship rate card cited a **CPM of ₹140**, and Season 2 sponsorships ranged from **₹1 crore/episode** up to a **₹10 crore title sponsor** — confirming brands pay premium money to reach this specific audience. After the Act can credibly position itself as another touchpoint to that same audience.

> Web ad CPMs for an independent entertainment *website* (vs. YouTube) in India are typically in the **low ₹ tens** range; use a conservative **₹30–₹120 per 1,000 impressions** band for modelling, and assume multiple ad impressions per engaged session.

### Monetization options & rough revenue ranges

> These ranges are **illustrative models**, not guarantees. They assume an engaged voting audience generating several ad impressions per visit and modest premium conversion. Validate against real traffic before relying on them.

| Model | 10K MAU | 50K MAU | 100K MAU | Notes |
|---|---|---|---|---|
| **Display/web ads** | ~₹15K–60K/mo | ~₹75K–₹3L/mo | ~₹1.5L–₹6L/mo | Scales with impressions/session; entertainment CPM is low, so volume-dependent |
| **Brand partnerships / sponsored leaderboards** | low (hard to land early) | ₹50K–₹2L+/mo | ₹2L–₹10L+/mo per deal | Highest upside; IGL's own ₹1–10cr sponsor deals show advertiser appetite for this audience |
| **Membership / Patreon-style tiers** | ₹5K–30K/mo | ₹30K–₹1.5L/mo | ₹1L–₹4L/mo | K-pop apps prove fans pay for premium currency/perks; assume 1–3% conversion |
| **Cosmetic upgrades** (badges, flair, premium stats) | small | modest | meaningful at scale | Low-cost, high-margin; directly mirrors K-pop app "diamonds/hearts" model |
| **Affiliate** (merch, event tickets) | negligible | small | small–modest | Opportunistic; depends on IGL merch/live-event tie-ins |

### Recommended top 2 monetization strategies
1. **Display ads + brand/sponsored leaderboards (primary).** Ads provide a baseline from day one; sponsored leaderboards ("This week's contestant rankings, powered by [brand]") are the real upside and are directly validated by IGL's own willingness to take ₹1–10cr sponsorships for the same eyeballs. This is where the money is at scale.
2. **Low-friction cosmetic upgrades + light membership (secondary).** Copy the K-pop playbook (Choeaedol/Mubeat/IdolChamp): in-app currency, badges, voting boosts, premium leaderboard stats. High margin, deepens engagement, and converts the most passionate ~1–3% of fans without putting the core voting behind a paywall. Keep voting itself free to protect growth.

*Avoid:* relying on display ads alone — entertainment CPMs in India are too low for ads to sustain the platform without large scale or sponsorship layered on top.

---

## Task 7: Risk Assessment

| # | Risk | Likelihood | Impact | Mitigation (one line) |
|---|---|---|---|---|
| 1 | **Single-show dependency** (IGL is the whole product) | Medium | **High** | Architect the platform to be format-agnostic; be ready to add other Indian shows (Bigg Boss, etc.) |
| 2 | **Show longevity / cancellation** (S3 unconfirmed; pulled offline once in Feb 2025) | Medium | **High** | Don't over-invest ahead of renewal news; keep the build lean per season |
| 3 | **Official entity launches its own voting** (Samay/Netflix already have an app) | Medium | High | Move first, build community moat & judge-rating niche the official app lacks; aim to partner, not compete |
| 4 | **Legal / IP — use of "India's Got Latent", names** (FIR-prone, litigious environment; C&D notices common in India) | Medium | Medium–High | Use clear "unofficial fan-made" disclaimers, avoid logos/trademarks, consider neutral branding; take legal advice early |
| 5 | **Community fragmentation** (no central Discord/Telegram; spread across YT/Reddit/X) | High | Medium | Position After the Act *as* the missing hub; meet fans on each platform with episode-timed content |
| 6 | **Engagement drop-off / "sanitized show" backlash** (S2 criticised as scripted/PR-driven; possible viewer fatigue) | Medium | Medium | Build features that thrive on dissatisfaction ("rate the judges," "was this fair?"); don't depend on hype peaks |
| 7 | **Content-controversy contagion** (show's own scandals could spill onto affiliated sites) | Medium | Medium | Keep moderation tight; stay editorially neutral and clearly independent of the show |

**Headline risk read:** the dominant risks are **single-show dependency** and **IP exposure**, both rated High-impact. Neither is a reason not to proceed, but both argue for (a) building the platform so it can pivot to other shows, and (b) getting early legal guidance on naming/branding. The Feb 2025 takedown of the entire show demonstrates concretely how fast this ecosystem can change.

---

## Recommended Next Steps

1. **Run one live "episode-cycle" test to prove conversion.** Pick the next S2 episode, push voting hard across Reddit/X/YouTube comments the night it drops, and measure: unique voters, repeat voters next episode, votes per visit. This is the one missing number — does comment-section energy convert to a destination? Cheap to run, decisive for the verdict.
2. **Own the empty SEO space now.** Ship dedicated, episode-refreshed pages for "India's Got Latent leaderboard / contestants ranking / vote / results." The SERP is effectively empty — claim these terms before anyone else does.
3. **Lean into the no-copyright-strike reaction wave.** Build a creator kit (embeddable leaderboard, shareable "official fan ranking" graphics) and seed it to reaction/ranking YouTubers and viral ex-contestants who have a personal incentive to share a board that ranks them.
4. **Make "rate the judges" the flagship differentiator.** It is the one feature nothing else offers (not TierMaker, not the official app), and demand for it is demonstrated ("loved vs hated judges" content, "judges were unfair" sentiment). Lead marketing with it.
5. **De-risk on IP and single-show dependency in parallel.** Add an "unofficial fan-made" disclaimer and get quick legal advice on the name/branding; architect the data model to support additional shows so the platform survives an IGL hiatus.

---

## Data Sources

**Note on the research environment:** live web search returned results dated into mid-2026 (including IGL Season 2 launching June 20, 2026 on YouTube + Netflix). These are reported faithfully as returned; Season 2 viewership figures in particular came from individual articles and should be re-verified directly before external use.

**Audience & viewership**
- Samay Raina YouTube stats — HypeAuditor, Social Blade, SocialCounts, NoxInfluencer
- Samay Raina Instagram (@maisamayhoon) — Qoruz, News9, EntertainIndia
- India's Got Latent — Wikipedia (S1 & S2 pages)
- IGL episode lists — IMDb, TMDB, Netflix
- IGL Season 2 review/viewership — AltBollywood, Mint (via Wikipedia), ETV Bharat, Open Magazine, Sunday Guardian
- Google India "Year in Search 2025" — blog.google / trends.withgoogle.com

**Engagement & demand**
- TierMaker — "India's Got Latent Contestants Tier List"
- Storyboard18 — contestant follower-growth / second-screen data (via Qoruz)
- Republic World — viral IGL contestants
- "Most Hated Vs Most Loved Judges in India's Got Latent" — YouTube
- Sunday Guardian — S2 X reactions; "no copyright strikes on IGL2 clips"
- Buzz-in-Content — Indian Gen-Z fandom report

**Competitors & references**
- Official IGL app — Apple App Store (developer: Samay Raina)
- Unofficial Bigg Boss voting sites — bbonlinevote.in, bigg-boss-vote.in, bb19voting.in, et al.
- K-pop voting apps — Choeaedol & Mubeat (Google Play / App Store), IdolChamp, Podoal; 7DREAM Global voting-platform overview

**Monetization & ads**
- IGL Season 2 sponsorship rate card & CPM — BestMediaInfo
- Indian YouTube CPM (entertainment) — upGrowth, TheDMSchool, MegaDigital, Atomcomm

**Risk & legal**
- Cease-and-desist / takedown procedure in India — KAnalysis, SSRana, Mondaq, IndiaFilings
- IGL controversy & legal timeline (Feb 2025 FIRs, removal, Supreme Court) — Wikipedia, afaqs!, Reflections
- IGL S2 "12 lawyers" pre-launch — IndiaHerald

**Search queries used (representative):** Samay Raina subscriber/follower counts; IGL average views per episode; IGL episode count; IGL peak concurrent viewers; IGL subreddit/Discord; IGL Google Trends; IGL judges unfair/scripted fan reaction; IGL fan voting website; Bigg Boss unofficial voting sites; K-pop voting apps monetization; Indian YouTube entertainment CPM; IGL reaction/ranking creators; creator shoutout traffic case study; IGL leaderboard/fan-vote SERP check; reality-show fan-site takedown/IP India; IGL Season 3 renewal.
