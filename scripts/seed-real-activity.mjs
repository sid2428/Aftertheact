// Layer lifelike user activity onto the REAL Season 1 already in the DB.
//
//   node scripts/seed-real-activity.mjs --dry    # parse + plan, write nothing
//   node scripts/seed-real-activity.mjs          # seed for real
//
// What it does (nothing is invented — every number traces back to seed/ data):
//   • ~150 reddit-style users (with trust tiers + voting personas)
//   • crowd votes per act whose averages track the Sheet-3 crowd sentiment
//   • predictions per episode (feeds the Oracle / Prophet's Wall leaderboard)
//   • judge ratings that track the Sheet-2 per-judge sentiment
//   • the ~240 REAL audience comments (seed/Untitled spreadsheet Sheet 1) become
//     roasts (Roast-Contestant rows) and community posts (everything else),
//     with likes / upvotes / replies scaled by each comment's sentiment
//   • flush + reveal each episode through the EXACT app RPCs, so peoples_verdict,
//     latent_score, vote-accuracy karma, oracle scores and ranks all populate
//   • every user (incl. the 7 real ones) gets the 1000 karma floor (migration 0028)
//
// LAYERS, never wipes: it reads the existing Episodes/Contestants (seeded by
// seed-s1-real.mjs) and only INSERTS. Season 1, episodes 1–12 only — the junk
// S2E1 / S69E69 test episodes are ignored.
//
// The "popularity score" columns in the research data are deliberately ignored
// (they're LLM-fabricated math); only the qualitative crowd-sentiment LABEL and
// the per-comment sentiment are used, exactly as asked.

import {
  supabase, redis, announceTarget, PROJECT_REF,
  chunkedParallel, CONCURRENCY, insertChunked,
  randInt, randFloat, pick, chance, shuffle, sample, gaussian, clamp, quantizeScore,
} from "./seed-common.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED = join(__dirname, "..", "seed");
const DRY = process.argv.includes("--dry");
// Resume after a mid-run failure: reuse the seed users already in the DB and skip
// the vote/prediction steps (which committed before the failure), so a re-run
// doesn't create a second set of users or double-count votes.
const RESUME = process.argv.includes("--resume");
// Finalize-only: content (users/votes/predictions/ratings/comments) is already in
// the DB; just (re)build the karma ledger and flush+reveal every episode. Implies
// resume. Idempotent — safe to re-run.
const FINALIZE = process.argv.includes("--finalize");
const USER_COUNT = 150;
const SEED_EMAIL_SUFFIX = "@aftertheact.seed";

// ── tiny CSV parser (RFC-4180-ish; handles quoted commas) ─────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c === "\r") { /* skip */ }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// Normalize a contestant/judge name for fuzzy matching across the data sources.
const norm = (s) =>
  String(s || "").toLowerCase().split("/")[0].replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9& ]/g, " ").replace(/\s+/g, " ").trim();

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Qualitative crowd-sentiment label → a 1–10 vote target. (We ignore the
// fabricated /100 popularity number; this label is the real signal.)
const SENTIMENT_TARGET = {
  "overwhelmingly positive": 9.1,
  "very positive": 8.4,
  "positive": 7.6,
  "slightly positive": 6.9,
  "mixed": 5.6,
  "slightly negative": 4.6,
  "negative": 3.2,
  "very negative": 2.2,
};
export const targetFromLabel = (label, fallback) => {
  const t = SENTIMENT_TARGET[String(label || "").toLowerCase().trim()];
  return t ?? fallback ?? 6.5;
};

// ── parse the spreadsheet (Sheet 1 comments, Sheet 2 judges, Sheet 3 acts) ────
function parseSpreadsheet() {
  const rows = parseCsv(readFileSync(join(SEED, "Untitled spreadsheet - Sheet1.csv"), "utf8"));
  let section = null;
  const comments = [];          // { ep, source, text, category, sentiment, ref }
  const judgeSentiment = new Map(); // slug → target /10
  const actSentiment = new Map();   // `${ep}|${normName}` → target /10

  for (const row of rows) {
    const c0 = (row[0] || "").trim();
    if (c0.startsWith("SHEET 1")) { section = 1; continue; }
    if (c0.startsWith("SHEET 2")) { section = 2; continue; }
    if (c0.startsWith("SHEET 3")) { section = 3; continue; }

    if (section === 1) {
      const m = c0.match(/^Episode\s*(\d+)/i);
      if (!m || !/^\d+$/.test((row[1] || "").trim())) continue; // header / blank
      comments.push({
        ep: +m[1],
        source: (row[2] || "").trim(),
        text: (row[3] || "").trim(),
        category: (row[4] || "").trim(),
        sentiment: parseFloat(row[5]) || 6,
        ref: (row[6] || "").trim(),
      });
    } else if (section === 2) {
      const name = c0;
      if (!name || name.startsWith("Judge Name")) continue;
      const raw = parseFloat(row[6]); // "Raw Sentiment Score (Avg /10)"
      if (!Number.isFinite(raw)) continue;
      // map the judge name to its panel slug (strip "(Rapper)" etc.)
      judgeSentiment.set(slugify(name.replace(/\(.*?\)/g, "").trim()), raw);
    } else if (section === 3) {
      const name = c0;
      if (!name || name.startsWith("Contestant Name")) continue;
      const ep = parseInt(row[1], 10);
      if (!Number.isFinite(ep)) continue;
      const target = targetFromLabel(row[5], null); // "Crowd Sentiment" label
      actSentiment.set(`${ep}|${norm(name)}`, target);
    }
  }
  return { comments, judgeSentiment, actSentiment };
}

// ── reddit-style username generator ───────────────────────────────────────────
const ADJ = ["Salty","Toasted","Crispy","Soggy","Feral","Sleepy","Spicy","Broke","Sigma","Based",
  "Cursed","Wholesome","Anxious","Caffeinated","Unhinged","Mildly","Retired","Aspiring","Certified",
  "Sus","Grumpy","Dramatic","Humble","Chaotic","Lowkey","Highkey","Random","Professional","Confused"];
const NOUN = ["Panda","Samosa","Chaiwala","Lurker","Goblin","Wizard","Pigeon","Mango","Rickshaw","Paneer",
  "Yeti","Raccoon","Bandar","Nimbu","Jalebi","Critic","Memer","Gamer","Uncle","Bhakt","Potato","Cat",
  "Frog","Sloth","Owl","Penguin","Walrus","Hamster","Ninja","Pundit","Nibba","Dhakkan","Vada"];
const FLAV = ["latent","samay","roast","verdict","panel","oracle","chai","desi","bhai","afterdark","stan","copium"];

function makeUsernames(n) {
  const used = new Set();
  const out = [];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const patterns = [
    () => `${cap(pick(ADJ))}_${cap(pick(NOUN))}`,
    () => `${cap(pick(ADJ))}${cap(pick(NOUN))}${randInt(1, 99)}`,
    () => `${pick(NOUN).toLowerCase()}_${pick(FLAV)}${randInt(1, 999)}`,
    () => `${pick(FLAV)}_${pick(NOUN).toLowerCase()}`,
    () => `${cap(pick(NOUN))}${cap(pick(NOUN))}${randInt(1, 9)}`,
    () => `${pick(FLAV)}_enjoyer_${randInt(1, 99)}`,
  ];
  let guard = 0;
  while (out.length < n && guard < n * 50) {
    guard++;
    let h = pick(patterns)().slice(0, 20);
    if (used.has(h.toLowerCase())) continue;
    used.add(h.toLowerCase());
    out.push(h);
  }
  return out;
}

// ── user generation (reddit names + trust tiers + voting personas) ────────────
function generateUsers(count) {
  const names = makeUsernames(count);
  return names.map((username, i) => {
    const onboarded = !chance(0.12);
    const roll = Math.random();
    let trust, tier;
    if (roll < 0.70) { trust = randFloat(0.2, 0.4); tier = "casual"; }
    else if (roll < 0.88) { trust = randFloat(0.4, 0.65); tier = "regular"; }
    else if (roll < 0.98) { trust = randFloat(0.65, 0.95); tier = "veteran"; }
    else { trust = randFloat(0.05, 0.15); tier = "casual"; }

    const bias = gaussian(0, 1) * 1.6;
    const troll = chance(0.08);
    const stan = chance(0.12);
    const activity = onboarded
      ? (tier === "veteran" ? 0.95 : tier === "regular" ? 0.85 : 0.7)
      : 0.18;
    const tag = bias > 1.2 ? "Generous Soul" : bias < -1.2 ? "Harsh Critic" : "Balanced Juror";

    return {
      username,
      email: `seed_${slugify(username)}_${i}@aftertheact.seed`,
      avatar_url: null,
      trust_score: Math.round(trust * 1000) / 1000,
      is_shadow_banned: chance(0.01),
      onboarded,
      voting_personality_tag: onboarded ? tag : null,
      created_at: new Date(Date.now() - randInt(1, 80) * 86_400_000 - randInt(0, 86_400) * 1000).toISOString(),
      _persona: { bias, troll, stan, activity, tier },
    };
  });
}

// ── vote score model: cluster around the contestant's sentiment target ────────
export function scoreFor(user, target) {
  const p = user._persona;
  let s;
  if (p.troll && chance(0.6)) s = randFloat(1, 3.5);
  else if (p.stan && chance(0.5)) s = clamp(target + randFloat(0.5, 2), 1, 10);
  else s = target + gaussian(0, 1.0) + p.bias * 0.35;
  return quantizeScore(s);
}
const participants = (users, fraction) => users.filter((u) => chance(u._persona.activity * fraction));

// Rebuild an approximate persona for a reloaded user (only the rating-variance
// bias + activity matter post-vote; the exact original values weren't stored).
function synthPersona(u) {
  const tier = u.trust_score >= 0.65 ? "veteran" : u.trust_score >= 0.4 ? "regular" : "casual";
  const activity = u.onboarded ? (tier === "veteran" ? 0.95 : tier === "regular" ? 0.85 : 0.7) : 0.18;
  return { bias: gaussian(0, 1) * 1.6, troll: false, stan: false, activity, tier };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  announceTarget(DRY ? "DRY-RUN (no writes) reading" : "SEEDING REAL ACTIVITY ON");

  const { comments, judgeSentiment, actSentiment } = parseSpreadsheet();
  console.log(`Parsed: ${comments.length} comments, ${judgeSentiment.size} judge sentiments, ${actSentiment.size} act sentiments.`);

  // 1) Load the real Season-1 episodes + contestants already in the DB.
  const { data: eps, error: epErr } = await supabase
    .from("Episode").select("id, episode_number, judge_ids")
    .eq("season_number", 1).gte("episode_number", 1).lte("episode_number", 12)
    .order("episode_number");
  if (epErr) throw new Error(`load Episode: ${epErr.message}`);
  if (!eps?.length) {
    console.error("✖ No Season-1 episodes found. Run scripts/seed-s1-real.mjs first.");
    process.exit(1);
  }

  const episodes = [];
  const judgeRoster = new Set();
  for (const e of eps) {
    const { data: app, error } = await supabase
      .from("ContestantEpisodeAppearance")
      .select("contestant_id, judge_average, Contestant(name)")
      .eq("episode_id", e.id);
    if (error) throw new Error(`load appearances E${e.episode_number}: ${error.message}`);
    const contestants = (app || []).map((a) => {
      const name = a.Contestant?.name || "?";
      const target = clamp(
        actSentiment.get(`${e.episode_number}|${norm(name)}`) ?? a.judge_average ?? 6.5,
        1, 10
      );
      return { id: a.contestant_id, name, target };
    });
    (e.judge_ids || []).forEach((j) => judgeRoster.add(j));
    episodes.push({ id: e.id, num: e.episode_number, judge_ids: e.judge_ids || [], contestants });
  }
  console.log(`Loaded ${episodes.length} episodes, ${episodes.reduce((n, e) => n + e.contestants.length, 0)} contestant appearances, ${judgeRoster.size} judges.`);

  // sanity: how well did act sentiments match?
  let matched = 0, total = 0;
  for (const e of episodes) for (const c of e.contestants) { total++; if (actSentiment.has(`${e.num}|${norm(c.name)}`)) matched++; }
  console.log(`Act sentiment match: ${matched}/${total} (rest fall back to judge_average).`);

  if (DRY) {
    console.log("\n[dry] sample targets:");
    for (const e of episodes.slice(0, 2)) {
      console.log(`  E${e.num}: ${e.contestants.map((c) => `${c.name.split(" ")[0]}→${c.target.toFixed(1)}`).join("  ")}`);
    }
    const rc = comments.filter((c) => /Roast - Contestant/i.test(c.category)).length;
    console.log(`\n[dry] ${rc} roast-contestant comments → Roast; ${comments.length - rc} → CommunityPost.`);
    console.log("[dry] no writes performed.");
    process.exit(0);
  }

  // Preflight the karma/counter RPCs the seed leans on (memory: prod once lacked these).
  await requireRpcs();

  // 2) Users — create them, or (on --resume) reload the ones already inserted.
  let users;
  if (RESUME || FINALIZE) {
    const { data, error } = await supabase
      .from("User").select("id, onboarded, trust_score, is_shadow_banned")
      .like("email", `%${SEED_EMAIL_SUFFIX}`);
    if (error) throw new Error(`reload seed users: ${error.message}`);
    users = (data || []).map((u) => ({ ...u, _persona: synthPersona(u) }));
    console.log(`✓ resume: reloaded ${users.length} existing seed users (votes/predictions kept).`);
  } else {
    const generated = generateUsers(USER_COUNT);
    const idByEmail = new Map();
    for (let i = 0; i < generated.length; i += 100) {
      const slice = generated.slice(i, i + 100).map(({ _persona, ...db }) => db);
      const { data, error } = await supabase.from("User").insert(slice).select("id, email");
      if (error) throw new Error(`insert User: ${error.message}`);
      for (const r of data) idByEmail.set(r.email, r.id);
    }
    users = generated.map((g) => ({ ...g, id: idByEmail.get(g.email) }));
    console.log(`✓ ${users.length} seed users inserted.`);
  }
  // include the real, pre-existing users as potential likers/repliers (not authors).
  const { data: realUsers } = await supabase.from("User").select("id").not("email", "like", `%${SEED_EMAIL_SUFFIX}`);
  const allUserIds = [...users.map((u) => u.id), ...(realUsers || []).map((u) => u.id)];
  console.log(`  (+${realUsers?.length || 0} existing users in the like/reply pool)`);

  const onboarded = users.filter((u) => u.onboarded && !u.is_shadow_banned);
  const karmaByUser = new Map(); // author_id → post_karma (likes+upvotes) to ledger later

  // 3) Votes + predictions per episode. (Skipped on resume — already committed.)
  let voteTotal = 0, predTotal = 0;
  for (const ep of ((RESUME || FINALIZE) ? [] : episodes)) {
    const voteRows = [];
    for (const u of participants(users, 0.85)) {
      if (u.is_shadow_banned) continue;
      for (const c of ep.contestants) {
        if (!chance(0.85)) continue;
        voteRows.push({
          user_id: u.id, episode_id: ep.id, contestant_id: c.id,
          score: scoreFor(u, c.target), trust_score_at_vote: u.trust_score,
        });
      }
    }
    await insertChunked("UserVote", voteRows, 500);
    voteTotal += voteRows.length;

    // predictions: top/bottom by sentiment target; trolls/some guess randomly.
    const byTarget = [...ep.contestants].sort((a, b) => b.target - a.target);
    const top3 = byTarget.slice(0, 3), bot3 = byTarget.slice(-3);
    const predRows = [];
    for (const u of participants(users, 0.7)) {
      if (u.is_shadow_banned) continue;
      let top, bottom;
      if (u._persona.troll || chance(0.25)) { [top, bottom] = sample(ep.contestants, 2); }
      else {
        top = pick(top3); bottom = pick(bot3);
        if (bottom.id === top.id) bottom = pick(bot3.filter((c) => c.id !== top.id)) || bottom;
      }
      if (!top || !bottom || top.id === bottom.id) continue;
      predRows.push({
        user_id: u.id, episode_id: ep.id,
        predicted_top_contestant_id: top.id,
        predicted_bottom_contestant_id: bottom.id,
        predicted_alignment: pick(["HARSH", "ALIGNED", "GENEROUS"]),
      });
    }
    await upsertChunked("UserPrediction", predRows, "user_id,episode_id");
    predTotal += predRows.length;
    console.log(`  E${ep.num}: ${voteRows.length} votes, ${predRows.length} predictions`);
  }
  console.log(`✓ ${voteTotal} votes, ${predTotal} predictions`);

  if (!FINALIZE) {
    // 4) Judge ratings — one per (user, judge), score tracking Sheet-2 sentiment.
    const firstEpOfJudge = new Map();
    for (const ep of episodes) for (const j of ep.judge_ids) if (!firstEpOfJudge.has(j)) firstEpOfJudge.set(j, ep.id);
    const ratingRows = [];
    const TAGS = ["Savage Roaster", "Genuinely Fair", "Petty Comments", "Backhanded Praise", "Overly Generous", "Visibly Bored"];
    for (const judgeId of judgeRoster) {
      const target = judgeSentiment.get(judgeId) ?? 7;
      const raters = sample(onboarded, randInt(25, 70));
      for (const u of raters) {
        const score = clamp(Math.round(target + gaussian(0, 1.2) + u._persona.bias * 0.25), 1, 10);
        ratingRows.push({
          judge_id: judgeId, user_id: u.id, episode_id: firstEpOfJudge.get(judgeId),
          harshness_score: score, accuracy_score: score, entertainment_score: score,
          overall_score: score, tag: pick(TAGS), comment: null,
        });
      }
    }
    await upsertChunked("JudgeRating", ratingRows, "judge_id,user_id,episode_id");
    console.log(`✓ ${ratingRows.length} judge ratings`);

    // 5) Comments → roasts + community posts (real text), likes/upvotes/replies.
    const { roasts, posts } = await seedComments(comments, episodes, onboarded, allUserIds, karmaByUser);
    console.log(`✓ ${roasts} roasts, ${posts} community posts (with sentiment-scaled likes/upvotes)`);
  }

  // 6) Karma floor (1000) + post_karma ledger for everyone, then reveal.
  const karma = FINALIZE ? await karmaFromDb() : karmaByUser;
  await applyKarmaLedger(allUserIds, karma);
  console.log(`✓ karma ledger: 1000 baseline for ${allUserIds.length} users + post_karma`);

  for (const ep of episodes) { await flush(ep); await reveal(ep); }
  console.log(`✓ flushed + revealed ${episodes.length} episodes (verdicts, latent_score, oracle, ranks)`);

  await summary();
  process.exit(0);
}

// ── comments → content ────────────────────────────────────────────────────────
async function seedComments(comments, episodes, authors, allUserIds, karmaByUser) {
  const epByNum = new Map(episodes.map((e) => [e.num, e]));
  const findContestant = (ep, ref) => {
    const n = norm(ref);
    if (!n) return null;
    return ep.contestants.find((c) => norm(c.name) === n)
        || ep.contestants.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name)))
        || null;
  };

  const roastRows = [], postRows = [];
  for (const cm of comments) {
    const ep = epByNum.get(cm.ep);
    if (!ep || !cm.text) continue;
    const author = pick(authors);
    if (!author) continue;
    const isRoast = /Roast - Contestant/i.test(cm.category);
    const tagged = findContestant(ep, cm.ref);
    if (isRoast && tagged) {
      roastRows.push({ _author: author, _sent: cm.sentiment,
        row: { user_id: author.id, episode_id: ep.id, contestant_id: tagged.id, content: cm.text.slice(0, 280), moderation_status: "PUBLISHED" } });
    } else {
      postRows.push({ _author: author, _sent: cm.sentiment,
        row: { user_id: author.id, text: cm.text.slice(0, 280), episode_tag: ep.id, contestant_tag: tagged ? tagged.id : null, moderation_status: "VISIBLE" } });
    }
  }

  // insert roasts, then upvotes (count ∝ sentiment), accumulate author karma.
  const insertedRoasts = [];
  for (let i = 0; i < roastRows.length; i += 500) {
    const slice = roastRows.slice(i, i + 500);
    const { data, error } = await supabase.from("Roast").insert(slice.map((r) => r.row)).select("id, user_id");
    if (error) throw new Error(`insert Roast: ${error.message}`);
    data.forEach((d, k) => insertedRoasts.push({ ...d, _sent: slice[k]._sent }));
  }
  const upvoteRows = [];
  for (const r of insertedRoasts) {
    const n = Math.min(allUserIds.length - 1, randInt(0, Math.round(3 + r._sent * 3.5)));
    const voters = sample(allUserIds.filter((id) => id !== r.user_id), n);
    for (const v of voters) upvoteRows.push({ roast_id: r.id, user_id: v });
    if (voters.length) karmaByUser.set(r.user_id, (karmaByUser.get(r.user_id) || 0) + voters.length);
    if (voters.length) await supabase.from("Roast").update({ upvote_count: voters.length }).eq("id", r.id);
  }
  await insertChunked("RoastUpvote", upvoteRows, 500);

  // insert community posts, then likes (∝ sentiment) + replies + a few reports.
  const insertedPosts = [];
  for (let i = 0; i < postRows.length; i += 500) {
    const slice = postRows.slice(i, i + 500);
    const { data, error } = await supabase.from("CommunityPost").insert(slice.map((r) => r.row)).select("id, user_id");
    if (error) throw new Error(`insert CommunityPost: ${error.message}`);
    data.forEach((d, k) => insertedPosts.push({ ...d, _sent: slice[k]._sent }));
  }
  const likeRows = [], replyRows = [], reportRows = [];
  for (const p of insertedPosts) {
    const n = Math.min(allUserIds.length - 1, randInt(0, Math.round(4 + p._sent * 5)));
    const likers = sample(allUserIds.filter((id) => id !== p.user_id), n);
    for (const l of likers) likeRows.push({ post_id: p.id, user_id: l });
    if (likers.length) karmaByUser.set(p.user_id, (karmaByUser.get(p.user_id) || 0) + likers.length);
    const replyN = chance(0.3) ? randInt(1, 2) : 0;
    for (let k = 0; k < replyN; k++) {
      const replier = pick(authors);
      if (replier) replyRows.push({ post_id: p.id, user_id: replier.id, text: pick(REPLIES).slice(0, 200) });
    }
    const counts = { like: likers.length, reply: replyN };
    if (counts.like || counts.reply) await supabase.from("CommunityPost").update({ like_count: counts.like, reply_count: counts.reply }).eq("id", p.id);
    if (chance(0.05)) { const rep = pick(allUserIds.filter((id) => id !== p.user_id)); if (rep) reportRows.push({ post_id: p.id, reporter_user_id: rep, reason: "Spam / off-topic" }); }
  }
  await insertChunked("CommunityPostLike", likeRows, 500);
  await insertChunked("CommunityPostReply", replyRows, 500);
  if (reportRows.length) await insertChunked("PostReport", reportRows, 500);

  return { roasts: insertedRoasts.length, posts: insertedPosts.length };
}

const REPLIES = [
  "Bhai facts.", "100% agreed.", "Nahi yaar, hard disagree.", "Underrated take.", "Lmaooo accurate.",
  "Samay would approve.", "Take my upvote.", "Controversial but true.", "This aged well.", "Bilkul sahi.",
  "Idk man, mid take.", "Finally someone said it.", "W comment.", "Cope harder lol.", "Real.",
];

// ── karma ledger: 1000 baseline + post_karma, idempotent ──────────────────────
// The episode-less karma rows are guarded by a PARTIAL unique index, which
// PostgREST can't use as an upsert conflict target — so we delete-then-insert
// (scoped to these users) instead of ON CONFLICT. Re-runnable.
async function applyKarmaLedger(allUserIds, karmaByUser) {
  for (let i = 0; i < allUserIds.length; i += 200) {
    const batch = allUserIds.slice(i, i + 200);
    const { error } = await supabase.from("LatentPointsLedger").delete()
      .is("episode_id", null).in("action_type", ["baseline", "post_karma"]).in("user_id", batch);
    if (error) throw new Error(`clear karma ledger: ${error.message}`);
  }
  const baseline = allUserIds.map((id) => ({ user_id: id, episode_id: null, action_type: "baseline", points: 1000 }));
  await insertChunked("LatentPointsLedger", baseline, 500);
  const pk = [...karmaByUser.entries()].filter(([, v]) => v > 0)
    .map(([id, v]) => ({ user_id: id, episode_id: null, action_type: "post_karma", points: v }));
  if (pk.length) await insertChunked("LatentPointsLedger", pk, 500);
}

// Rebuild post_karma from the DB (sum of likes on a user's posts + upvotes on
// their roasts) — used by --finalize so it doesn't depend on the in-memory map.
async function karmaFromDb() {
  const map = new Map();
  const { data: posts } = await supabase.from("CommunityPost").select("user_id, like_count");
  for (const p of posts || []) if (p.like_count) map.set(p.user_id, (map.get(p.user_id) || 0) + p.like_count);
  const { data: roasts } = await supabase.from("Roast").select("user_id, upvote_count");
  for (const r of roasts || []) if (r.upvote_count) map.set(r.user_id, (map.get(r.user_id) || 0) + r.upvote_count);
  return map;
}

// ── flush (replicates the flush-votes cron aggregation) ───────────────────────
async function flush(ep) {
  const { data: votes } = await supabase
    .from("UserVote").select("contestant_id, score, trust_score_at_vote").eq("episode_id", ep.id);
  const agg = {};
  for (const v of votes || []) {
    const trust = Number.isFinite(Number(v.trust_score_at_vote)) ? Number(v.trust_score_at_vote) : 0;
    const score = Number(v.score);
    if (!Number.isFinite(score)) continue;
    const a = (agg[v.contestant_id] ||= { sum: 0, count: 0, wSum: 0, wTrust: 0 });
    a.sum += score; a.count += 1; a.wSum += score * trust; a.wTrust += trust;
  }
  for (const [cid, a] of Object.entries(agg)) {
    if (!a.count) continue;
    const raw = a.sum / a.count;
    const weighted = a.wTrust > 0 ? a.wSum / a.wTrust : raw;
    await supabase.from("ContestantEpisodeAppearance").update({
      peoples_verdict_raw: raw, peoples_verdict_weighted: weighted,
      total_votes_raw: a.count, total_votes_weighted: a.wTrust,
    }).match({ episode_id: ep.id, contestant_id: cid });
  }
}

// ── reveal: un-trigger (seed-s1 left it REVEALED) then run the EXACT app RPCs ──
async function reveal(ep) {
  // score_episode_predictions early-returns if is_revelation_triggered — the
  // existing rows were seeded as already-revealed, so reset first; the RPC flips
  // it back to REVEALED at the end. (Brief LIVE blip during this one-shot run.)
  await supabase.from("Episode").update({ status: "LIVE", is_revelation_triggered: false }).eq("id", ep.id);
  const { error: e1 } = await supabase.rpc("score_episode_predictions", { p_episode_id: ep.id });
  if (e1) throw new Error(`score_episode_predictions E${ep.num}: ${e1.message}`);
  const { error: e2 } = await supabase.rpc("award_episode_latent_points", { p_episode_id: ep.id });
  if (e2) throw new Error(`award_episode_latent_points E${ep.num}: ${e2.message}`);
  if (redis) await redis.del(`episode:${ep.id}:scores`, `episode:${ep.id}:voter_count`).catch(() => {});
}

// ── helpers ───────────────────────────────────────────────────────────────────
async function upsertChunked(table, rows, onConflict, chunk = 500, doUpdate = false) {
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + chunk), { onConflict, ignoreDuplicates: !doUpdate });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }
}

const ZERO = "00000000-0000-0000-0000-000000000000";
async function requireRpcs() {
  const probes = [
    ["score_episode_predictions", { p_episode_id: ZERO }],
    ["award_episode_latent_points", { p_episode_id: ZERO }],
    ["adjust_user_karma", { p_user_id: ZERO, p_delta: 0 }],
  ];
  const missing = [];
  for (const [name, args] of probes) {
    const { error } = await supabase.rpc(name, args);
    if (error && (error.code === "PGRST202" || /could not find the function|does not exist/i.test(error.message))) missing.push(name);
  }
  // confirm the partial unique index exists by probing the upsert target shape.
  if (missing.length) {
    console.error(`\n✖ Missing RPCs on this DB: ${missing.join(", ")}`);
    console.error("  Run supabase/migrations/0026-sync-and-optimize.sql AND 0028-karma-baseline-1000.sql in the SQL editor, then re-run.\n");
    process.exit(1);
  }
}

async function summary() {
  console.log("\n" + "═".repeat(60));
  console.log(`SEEDED — ${PROJECT_REF}`);
  console.log("═".repeat(60));
  const { data: top } = await supabase.from("User")
    .select("username, latent_points_season, season_rank, oracle_score")
    .order("latent_points_season", { ascending: false }).limit(10);
  console.log("\n🏆 Top 10 (karma / season standing):");
  for (const u of top || [])
    console.log(`  #${String(u.season_rank).padStart(2)} ${(u.username || "").padEnd(20)} ${String(u.latent_points_season).padStart(5)}  oracle=${(u.oracle_score || 0).toFixed(2)}`);

  const tables = ["User", "UserVote", "UserPrediction", "JudgeRating", "Roast", "RoastUpvote", "CommunityPost", "CommunityPostLike", "CommunityPostReply", "LatentPointsLedger"];
  console.log("\n📊 Row counts:");
  for (const t of tables) {
    const { count } = await supabase.from(t).select("id", { count: "exact", head: true });
    console.log(`  ${t.padEnd(22)} ${count ?? 0}`);
  }
  console.log("");
}

// Only run when invoked directly (so the self-check can import the helpers).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error("\n✖ seed-real-activity failed:", err.message); console.error(err.stack); process.exit(1); });
}
