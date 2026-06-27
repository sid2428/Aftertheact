// Simulate a full India's Got Latent season's worth of real user activity against
// the (throwaway) dev Supabase + Redis, so every board has lifelike data and you
// can watch latent/live scores populate exactly as they would on the website.
//
//   node scripts/simulate-igl.mjs                 # fast: seed the whole season
//   node scripts/simulate-igl.mjs --watch         # trickle the LIVE episode's
//                                                 # votes so you can watch the
//                                                 # live scoreboard climb
//   node scripts/simulate-igl.mjs --watch --reveal-live
//                                                 # ...then flush + reveal the
//                                                 # LIVE episode so you watch
//                                                 # latent_score finalize
//
// FIDELITY: the LIVE episode's votes go through the EXACT same recordVote() core
// the website's submitVote server action uses (src/lib/voteCore.js) — identical
// Redis aggregates + UserVote writes. Reveal calls the EXACT same RPCs the app's
// triggerRevelation uses (score_episode_predictions + award_episode_latent_points).
// Already-REVEALED episodes are bulk-seeded for speed (their live Redis keys are
// deleted at reveal anyway), then revealed through those same RPCs.

import {
  supabase, redis, preflight, announceTarget,
  chunkedParallel, CONCURRENCY, insertChunked,
  randInt, randFloat, pick, chance, shuffle, sample, gaussian, clamp, quantizeScore,
} from "./seed-common.mjs";
import {
  JUDGES, EPISODE_PLAN, buildContestants, generateUsers, slugify,
  ROAST_LINES, COMMUNITY_LINES, ROAST_TAGS,
} from "./seed-data.mjs";

const args = process.argv.slice(2);
const WATCH = args.includes("--watch");
const REVEAL_LIVE = args.includes("--reveal-live");
const USER_COUNT = 300;

// recordVote is imported dynamically inside main() so the .env is guaranteed
// loaded (src/lib/supabase.js + upstash.js read env at module-eval time).
let recordVote;

let HAS_OVERALL_SCORE = false; // legacy JudgeRating columns present? (probed in preflight)

// ── date helpers ────────────────────────────────────────────────────────────
const iso = (ms) => new Date(ms).toISOString();
const daysAgo = (d) => iso(Date.now() - d * 86_400_000 - randInt(0, 3600_000));
const hoursAgo = (h) => iso(Date.now() - h * 3_600_000);
const hoursFromNow = (h) => iso(Date.now() + h * 3_600_000);
const daysFromNow = (d) => iso(Date.now() + d * 86_400_000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let CSLUG = 0; // global counter → unique Contestant.slug
const POOL = { i: 0 }; // act-pool cursor, advanced across episodes for variety

// ── users ───────────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log(`Seeding ${USER_COUNT} users…`);
  const generated = generateUsers(USER_COUNT);
  const rows = generated.map(({ _persona, ...db }) => db);
  const idByEmail = new Map();
  for (let i = 0; i < rows.length; i += 100) {
    const slice = rows.slice(i, i + 100);
    const { data, error } = await supabase.from("User").insert(slice).select("id, email");
    if (error) throw new Error(`insert User: ${error.message}`);
    for (const r of data) idByEmail.set(r.email, r.id);
  }
  const users = generated.map((g) => ({ ...g, id: idByEmail.get(g.email) }));
  const onboarded = users.filter((u) => u.onboarded).length;
  console.log(`  ${users.length} users (${onboarded} onboarded, ${users.length - onboarded} temp-name).`);
  return users;
}

// ── judge panel pool (Redis) ────────────────────────────────────────────────
// Store the full roster; the app surfaces the first MAX_PANEL (5) via
// getPanelMembers, so the active/rated panel below is JUDGES.slice(0, 5).
const ACTIVE_JUDGES = JUDGES.slice(0, 5).map((j) => ({ ...j, id: slugify(j.name) }));
const JUDGE_POP = new Map(ACTIVE_JUDGES.map((j, i) => [j.id, i === 0 ? 1.6 : randFloat(-1.2, 1.2)]));

async function seedPanel() {
  if (!redis) {
    console.log("Skipping judge panel (no Redis).");
    return;
  }
  const members = JUDGES.map((j) => ({
    id: slugify(j.name),
    name: j.name,
    image: "",
    descriptor: j.descriptor,
    instagram_handle: j.instagram_handle,
    bio: j.bio,
    tags: j.tags,
    show_in_hero: true,
  }));
  await redis.set("panel:members", members);
  console.log(`Seeded judge panel (${members.length} in pool, top 5 active on boards).`);
}

// ── episode + contestants ───────────────────────────────────────────────────
async function createEpisode(plan) {
  let status, air_date, voting_window_close;
  if (plan.state === "REVEALED") {
    status = "LIVE"; // reveal RPC flips it to REVEALED at the end
    air_date = daysAgo(randInt(10, 45));
    voting_window_close = hoursAgo(randInt(1, 96));
  } else if (plan.state === "LIVE") {
    status = "LIVE";
    air_date = hoursAgo(randInt(2, 12));
    voting_window_close = hoursFromNow(randInt(12, 36));
  } else {
    status = "UPCOMING";
    air_date = daysFromNow(randInt(2, 7));
    voting_window_close = null;
  }

  // Host always sits; two guests rotate (from the active, displayable panel).
  const guests = sample(ACTIVE_JUDGES.slice(1), 2);
  const judge_ids = [ACTIVE_JUDGES[0].id, ...guests.map((g) => g.id)];

  const { data: epRow, error } = await supabase
    .from("Episode")
    .insert({
      season_number: plan.season,
      episode_number: plan.episode,
      title: plan.title,
      air_date,
      voting_window_close,
      status,
      judge_ids,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insert Episode S${plan.season}E${plan.episode}: ${error.message}`);

  const acts = buildContestants(plan, POOL); // POOL.i advances across episodes
  for (const a of acts) a.slug = `${slugify(a.name)}-${++CSLUG}`;

  const { data: cRows, error: cErr } = await supabase
    .from("Contestant")
    .insert(acts.map((a) => ({ name: a.name, slug: a.slug, talent_type: a.talent_type, bio: a.bio })))
    .select("id, slug");
  if (cErr) throw new Error(`insert Contestant: ${cErr.message}`);
  const idBySlug = new Map(cRows.map((r) => [r.slug, r.id]));
  for (const a of acts) a.id = idBySlug.get(a.slug);

  const { error: aErr } = await supabase.from("ContestantEpisodeAppearance").insert(
    acts.map((a) => ({
      contestant_id: a.id,
      episode_id: epRow.id,
      judge_average: a.judge_average,
      self_score: a.self_score,
      // peoples_verdict_weighted stays null until flush — no crowd metric before reveal.
    }))
  );
  if (aErr) throw new Error(`insert Appearance: ${aErr.message}`);

  return { id: epRow.id, plan, judge_ids, contestants: acts };
}

// ── vote scoring model ──────────────────────────────────────────────────────
function scoreFor(user, contestant) {
  const p = user._persona;
  let s;
  if (p.troll && chance(0.7)) s = randFloat(1, 3.5);             // trolls spray low
  else if (p.stan && chance(0.6)) s = randFloat(7.5, 10);        // stans inflate
  else s = contestant.quality + gaussian(0, 1.1) + p.bias * 0.5; // around true appeal
  return quantizeScore(s);
}

// pick the users who take an action this round, gated by their activity level.
const participants = (users, fraction) => users.filter((u) => chance(u._persona.activity * fraction));

// ── predictions ─────────────────────────────────────────────────────────────
async function lockPredictions(ep, users, fraction) {
  const byQuality = [...ep.contestants].sort((a, b) => b.quality - a.quality);
  const top3 = byQuality.slice(0, 3);
  const bottom3 = byQuality.slice(-3);
  const rows = [];
  for (const u of participants(users, fraction)) {
    let top, bottom;
    if (u._persona.troll || chance(0.25)) {
      [top, bottom] = sample(ep.contestants, 2);
    } else {
      top = pick(top3);
      bottom = pick(bottom3);
      if (bottom.id === top.id) bottom = pick(bottom3.filter((c) => c.id !== top.id)) || bottom;
    }
    if (!top || !bottom || top.id === bottom.id) continue;
    const alignment = chance(0.5) ? ep.plan.alignment : pick(["HARSH", "ALIGNED", "GENEROUS"]);
    rows.push({
      user_id: u.id,
      episode_id: ep.id,
      predicted_top_contestant_id: top.id,
      predicted_bottom_contestant_id: bottom.id,
      predicted_alignment: alignment,
    });
  }
  await upsertChunked("UserPrediction", rows, "user_id,episode_id");
  return rows.length;
}

// ── votes: bulk (historical revealed episodes) ──────────────────────────────
async function castVotesBulk(ep, users, turnout) {
  const rows = [];
  for (const u of participants(users, turnout)) {
    for (const c of ep.contestants) {
      if (!chance(0.85)) continue; // not everyone scores every act
      rows.push({
        user_id: u.id,
        episode_id: ep.id,
        contestant_id: c.id,
        score: scoreFor(u, c),
        trust_score_at_vote: u.trust_score,
      });
    }
  }
  await insertChunked("UserVote", rows, 500);
  return rows.length;
}

// ── votes: live (the watchable episode) — via the EXACT recordVote core ──────
async function castVotesLive(ep, users, turnout, { watch }) {
  const events = [];
  for (const u of participants(users, turnout)) {
    for (const c of ep.contestants) {
      if (!chance(0.7)) continue;
      events.push({ u, c, score: scoreFor(u, c) });
    }
  }
  shuffle(events);
  const fire = (ev) =>
    recordVote({
      userId: ev.u.id,
      episodeId: ep.id,
      contestantId: ev.c.id,
      score: ev.score,
      trustScore: ev.u.trust_score,
      skipDupCheck: true, // fresh DB; the unique upsert still guards real dupes
    });

  if (!watch) {
    await chunkedParallel(events, CONCURRENCY, fire);
    return events.length;
  }

  // Paced mode: trickle votes so the live scoreboard visibly climbs.
  console.log(`\n  ▶ WATCH MODE — trickling ${events.length} live votes. Open the live`);
  console.log(`    scoreboard for "${ep.plan.title}" and watch it climb.\n`);
  const TICK = 8;
  for (let i = 0; i < events.length; i += TICK) {
    await chunkedParallel(events.slice(i, i + TICK), TICK, fire);
    if ((i / TICK) % 4 === 0) await printLive(ep);
    await sleep(1400);
  }
  await printLive(ep);
  return events.length;
}

async function printLive(ep) {
  if (!redis) return;
  const hash = await redis.hgetall(`episode:${ep.id}:scores`);
  if (!hash) return;
  const voterCount = Number(hash.voter_count || 0);
  const line = ep.contestants
    .map((c) => {
      const total = Number(hash[`${c.id}:total`] || 0);
      const count = Number(hash[`${c.id}:count`] || 0);
      const avg = count > 0 ? (total / count).toFixed(1) : "—";
      return `${c.name.split(" ")[0]} ${avg}(${count})`;
    })
    .join("  ·  ");
  console.log(`    [live] voters=${voterCount}  ${line}`);
}

// ── flush (replicates src/app/api/cron/flush-votes) ─────────────────────────
async function flush(ep) {
  const { data: votes } = await supabase
    .from("UserVote")
    .select("contestant_id, score, trust_score_at_vote")
    .eq("episode_id", ep.id);

  const agg = {};
  for (const v of votes || []) {
    const trust = Number.isFinite(Number(v.trust_score_at_vote)) ? Number(v.trust_score_at_vote) : 0;
    const score = Number(v.score);
    if (!Number.isFinite(score)) continue;
    const a = (agg[v.contestant_id] ||= { sum: 0, count: 0, wSum: 0, wTrust: 0 });
    a.sum += score; a.count += 1; a.wSum += score * trust; a.wTrust += trust;
  }
  for (const [contestantId, a] of Object.entries(agg)) {
    if (a.count === 0) continue;
    const rawAverage = a.sum / a.count;
    const weightedAverage = a.wTrust > 0 ? a.wSum / a.wTrust : rawAverage;
    await supabase
      .from("ContestantEpisodeAppearance")
      .update({
        peoples_verdict_raw: rawAverage,
        peoples_verdict_weighted: weightedAverage,
        total_votes_raw: a.count,
        total_votes_weighted: a.wTrust,
      })
      .match({ episode_id: ep.id, contestant_id: contestantId });
  }
}

// ── reveal (EXACT same RPCs as app's triggerRevelation) ─────────────────────
async function reveal(ep) {
  const { error: e1 } = await supabase.rpc("score_episode_predictions", { p_episode_id: ep.id });
  if (e1) throw new Error(`score_episode_predictions: ${e1.message}`);
  const { error: e2 } = await supabase.rpc("award_episode_latent_points", { p_episode_id: ep.id });
  if (e2) throw new Error(`award_episode_latent_points: ${e2.message}`);
  if (redis) {
    await redis.del(`episode:${ep.id}:scores`, `episode:${ep.id}:voter_count`).catch(() => {});
  }
}

// ── judge the judges ────────────────────────────────────────────────────────
async function rateJudges(ep, users, fraction) {
  const rows = [];
  for (const u of participants(users, fraction)) {
    if (u.is_shadow_banned || !u.onboarded) continue;
    for (const judgeId of ep.judge_ids) {
      if (!chance(0.8)) continue;
      const pop = JUDGE_POP.get(judgeId) ?? 0;
      const score = clamp(Math.round(6 + gaussian(0, 1.8) + pop + u._persona.bias * 0.3), 1, 10);
      rows.push({
        judge_id: judgeId,
        user_id: u.id,
        episode_id: ep.id,
        harshness_score: score,
        accuracy_score: score,
        entertainment_score: score,
        comment: null,
        ...(HAS_OVERALL_SCORE ? { overall_score: score, tag: pick(ROAST_TAGS) } : {}),
      });
    }
  }
  await upsertChunked("JudgeRating", rows, "judge_id,user_id,episode_id");
  return rows.length;
}

// ── roasts + upvotes (upvotes via the EXACT app RPC path) ────────────────────
async function postRoasts(ep, users, fraction) {
  const authors = participants(users, fraction).filter((u) => u.onboarded && !u.is_shadow_banned);
  const roastRows = [];
  for (const u of authors) {
    const n = chance(0.3) ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const c = pick(ep.contestants);
      roastRows.push({
        user_id: u.id,
        episode_id: ep.id,
        contestant_id: c.id,
        content: pick(ROAST_LINES).replace("{name}", c.name).slice(0, 280),
        moderation_status: "PUBLISHED",
      });
    }
  }
  if (roastRows.length === 0) return { roasts: 0, upvotes: 0 };

  const inserted = [];
  for (let i = 0; i < roastRows.length; i += 500) {
    const { data, error } = await supabase.from("Roast").insert(roastRows.slice(i, i + 500)).select("id, user_id");
    if (error) throw new Error(`insert Roast: ${error.message}`);
    inserted.push(...data);
  }

  // Upvotes through the real atomic path: RoastUpvote insert → increment_roast_upvotes
  // → adjust_user_karma. Run concurrently to genuinely exercise the counters.
  const events = [];
  for (const roast of inserted) {
    const voters = sample(users.filter((u) => u.id !== roast.user_id), randInt(0, 12));
    for (const v of voters) events.push({ roastId: roast.id, authorId: roast.user_id, voterId: v.id });
  }
  await chunkedParallel(events, CONCURRENCY, async (ev) => {
    const { error } = await supabase.from("RoastUpvote").insert({ user_id: ev.voterId, roast_id: ev.roastId });
    if (error) return; // 23505 dupe or FK race — skip
    const { data: authorId } = await supabase.rpc("increment_roast_upvotes", { p_roast_id: ev.roastId });
    if (authorId) await supabase.rpc("adjust_user_karma", { p_user_id: authorId, p_delta: 1 });
  });
  return { roasts: inserted.length, upvotes: events.length };
}

// ── community feed (likes via the EXACT app RPC path) ────────────────────────
async function postCommunity(users, episodes) {
  const authors = participants(users, 0.5).filter((u) => u.onboarded && !u.is_shadow_banned);
  const taggable = episodes.filter((e) => e.plan.state !== "UPCOMING");
  const postRows = authors.map((u) => {
    const tagEp = chance(0.5) ? pick(taggable) : null;
    const tagC = tagEp && chance(0.5) ? pick(tagEp.contestants) : null;
    return {
      user_id: u.id,
      text: pick(COMMUNITY_LINES).slice(0, 280),
      episode_tag: tagEp ? tagEp.id : null,
      contestant_tag: tagC ? tagC.id : null,
      moderation_status: "VISIBLE",
    };
  });
  if (postRows.length === 0) return { posts: 0, likes: 0, replies: 0, reports: 0 };

  const posts = [];
  for (let i = 0; i < postRows.length; i += 500) {
    const { data, error } = await supabase.from("CommunityPost").insert(postRows.slice(i, i + 500)).select("id, user_id");
    if (error) throw new Error(`insert CommunityPost: ${error.message}`);
    posts.push(...data);
  }

  // Likes → adjust_post_likes + adjust_user_karma (the route's exact RPCs).
  const likeEvents = [];
  for (const post of posts) {
    const likers = sample(users.filter((u) => u.id !== post.user_id), randInt(0, 25));
    for (const l of likers) likeEvents.push({ postId: post.id, authorId: post.user_id, likerId: l.id });
  }
  await chunkedParallel(likeEvents, CONCURRENCY, async (ev) => {
    const { error } = await supabase.from("CommunityPostLike").insert({ post_id: ev.postId, user_id: ev.likerId });
    if (error) return;
    await supabase.rpc("adjust_post_likes", { p_post_id: ev.postId, p_delta: 1 });
    if (ev.authorId) await supabase.rpc("adjust_user_karma", { p_user_id: ev.authorId, p_delta: 1 });
  });

  // A few replies + reports for the community/admin views.
  const replyTargets = sample(posts, Math.ceil(posts.length * 0.3));
  let replies = 0;
  await chunkedParallel(replyTargets, CONCURRENCY, async (post) => {
    const replier = pick(users.filter((u) => u.onboarded && !u.is_shadow_banned));
    if (!replier) return;
    const { error } = await supabase.from("CommunityPostReply").insert({
      post_id: post.id, user_id: replier.id, text: pick(COMMUNITY_LINES).slice(0, 200),
    });
    if (!error) { await supabase.rpc("bump_post_replies", { p_post_id: post.id }); replies++; }
  });

  const reportTargets = sample(posts, Math.ceil(posts.length * 0.08));
  let reports = 0;
  for (const post of reportTargets) {
    const reporter = pick(users.filter((u) => u.id !== post.user_id));
    const { error } = await supabase.from("PostReport").insert({
      post_id: post.id, reporter_user_id: reporter.id, reason: "Spam / off-topic",
    });
    if (!error) reports++;
  }

  return { posts: posts.length, likes: likeEvents.length, replies, reports };
}

// ── small upsert helper ─────────────────────────────────────────────────────
async function upsertChunked(table, rows, onConflict, chunk = 500) {
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + chunk), { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
async function printSummary(episodes) {
  console.log("\n" + "═".repeat(64));
  console.log("SEASON SEEDED — sample of what the boards now show");
  console.log("═".repeat(64));

  const { data: top } = await supabase
    .from("User")
    .select("username, latent_points_season, season_rank, oracle_score, badges")
    .order("latent_points_season", { ascending: false })
    .limit(10);
  console.log("\n🏆 Leaderboard (Season Standing) — top 10:");
  for (const u of top || []) {
    const badges = Array.isArray(u.badges) && u.badges.length ? ` [${u.badges.join(", ")}]` : "";
    console.log(
      `  #${String(u.season_rank).padStart(2)} ${u.username.padEnd(20)} ${String(u.latent_points_season).padStart(5)} LP` +
        `  oracle=${(u.oracle_score || 0).toFixed(2)}${badges}`
    );
  }

  const revealed = episodes.find((e) => e.plan.state === "REVEALED");
  if (revealed) {
    const { data: board } = await supabase
      .from("ContestantEpisodeAppearance")
      .select("latent_score, peoples_verdict_weighted, judge_average, self_score, Contestant(name)")
      .eq("episode_id", revealed.id)
      .order("latent_score", { ascending: false });
    console.log(`\n🎭 Verdict board — "${revealed.plan.title}" (${revealed.plan.alignment}):`);
    console.log(`     ${"Act".padEnd(22)} latent  crowd  judges  self`);
    for (const r of board || []) {
      const f = (v) => (v == null ? "  — " : Number(v).toFixed(1).padStart(4));
      console.log(`     ${(r.Contestant?.name || "?").padEnd(22)} ${f(r.latent_score)}   ${f(r.peoples_verdict_weighted)}   ${f(r.judge_average)}  ${f(r.self_score)}`);
    }
  }

  const { data: jr } = await supabase.from("JudgeRating").select("judge_id");
  const counts = {};
  for (const r of jr || []) counts[r.judge_id] = (counts[r.judge_id] || 0) + 1;
  console.log("\n⚖️  Judge popularity (ratings cast):");
  for (const j of ACTIVE_JUDGES) {
    console.log(`     ${j.name.padEnd(20)} ${counts[j.id] || 0} votes`);
  }

  const tables = ["User", "Episode", "Contestant", "UserVote", "UserPrediction", "JudgeRating", "Roast", "RoastUpvote", "CommunityPost", "CommunityPostLike", "LatentPointsLedger"];
  console.log("\n📊 Row counts:");
  for (const t of tables) {
    const { count } = await supabase.from(t).select("id", { count: "exact", head: true });
    console.log(`     ${t.padEnd(22)} ${count ?? 0}`);
  }

  const live = episodes.find((e) => e.plan.state === "LIVE");
  if (live && !REVEAL_LIVE) {
    console.log(`\n👀 LIVE episode "${live.plan.title}" is mid-voting — open its scoreboard to watch the crowd average.`);
    if (!WATCH) console.log("   (Re-run with --watch to trickle its votes in real time.)");
  }
  console.log("");
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  announceTarget("SIMULATING ON");

  // Fresh-DB guard: episodes carry a UNIQUE(season, episode), so a re-run without
  // clearing first would fail with a cryptic duplicate-key error. Catch it early.
  const { count: existingEpisodes } = await supabase.from("Episode").select("id", { count: "exact", head: true });
  if (existingEpisodes) {
    console.error(`\n✖ ${existingEpisodes} episode(s) already exist. Clear first:\n\n  node scripts/clear-db.mjs --yes\n`);
    process.exit(1);
  }

  const pf = await preflight();
  if (!pf.ok) process.exit(1);
  HAS_OVERALL_SCORE = pf.hasOverallScore;

  ({ recordVote } = await import("../src/lib/voteCore.js"));

  const users = await seedUsers();
  await seedPanel();

  console.log("\nBuilding episodes…");
  const episodes = [];
  for (const plan of EPISODE_PLAN) {
    const ep = await createEpisode(plan);
    episodes.push(ep);
    console.log(`  S${plan.season}E${plan.episode} "${plan.title}" [${plan.state}] — ${ep.contestants.length} acts`);
  }

  for (const ep of episodes) {
    const { state } = ep.plan;
    console.log(`\n▶ S${ep.plan.season}E${ep.plan.episode} (${state})`);

    if (state === "REVEALED") {
      const p = await lockPredictions(ep, users, 0.7);
      const v = await castVotesBulk(ep, users, 0.85);
      await flush(ep);
      await reveal(ep);
      const j = await rateJudges(ep, users, 0.5);
      const r = await postRoasts(ep, users, 0.4);
      console.log(`  predictions=${p} votes=${v} judgeRatings=${j} roasts=${r.roasts} roastUpvotes=${r.upvotes} → REVEALED`);
    } else if (state === "LIVE") {
      const p = await lockPredictions(ep, users, 0.6);
      const v = await castVotesLive(ep, users, 0.45, { watch: WATCH });
      const j = await rateJudges(ep, users, 0.35);
      const r = await postRoasts(ep, users, 0.3);
      console.log(`  predictions=${p} liveVotes=${v} judgeRatings=${j} roasts=${r.roasts} roastUpvotes=${r.upvotes}`);
      if (REVEAL_LIVE) {
        console.log("  --reveal-live → flushing + revealing the LIVE episode…");
        await flush(ep);
        await reveal(ep);
        console.log("  → REVEALED (latent_score finalized)");
      }
    } else {
      const p = await lockPredictions(ep, users, 0.4);
      console.log(`  predictions=${p} (voting not open yet)`);
    }
  }

  console.log("\n▶ Community feed…");
  const community = await postCommunity(users, episodes);
  console.log(`  posts=${community.posts} likes=${community.likes} replies=${community.replies} reports=${community.reports}`);

  await printSummary(episodes);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✖ simulate-igl failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
