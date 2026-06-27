// Shared infrastructure for the seed/simulation scripts (clear-db, simulate-igl).
//
// Zero new dependencies: a tiny inline .env parser (the repo has no dotenv) plus
// the already-installed @supabase/supabase-js and @upstash/redis. Everything runs
// against the SERVICE ROLE key — these scripts intentionally bypass RLS/auth the
// same way the app's cron + admin paths do (see src/lib/supabase.js, flush-votes).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

// ── .env loader ─────────────────────────────────────────────────────────────
// Loads REPO_ROOT/.env into process.env (without overwriting anything already
// set). Minimal KEY=VALUE parser: ignores blanks/comments, strips matching
// surrounding quotes. The repo keeps secrets in `.env` (not `.env.local`).
export function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(REPO_ROOT, ".env"), "utf8");
  } catch {
    return; // no .env — rely on a pre-populated process.env
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnv();

// ── Clients ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// The Supabase project ref (subdomain). Printed before any destructive action so
// you can SEE which database you're about to touch.
export const PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).host.split(".")[0];
  } catch {
    return SUPABASE_URL;
  }
})();

// Redis is optional: the reveal pipeline reads UserVote from Postgres, so the
// simulation works without it. It's only used to (a) seed the judge panel pool
// and (b) populate the LIVE episode's live aggregate hash. If Upstash isn't
// configured we degrade gracefully instead of crashing.
export const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("[seed] Upstash not configured — skipping Redis (judge pool + live hash).");
    return null;
  }
  return new Redis({ url, token });
})();

// ── Random helpers ──────────────────────────────────────────────────────────
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randFloat = (min, max) => Math.random() * (max - min) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick `n` distinct random elements.
export const sample = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));

// Approx. standard-normal noise (sum of uniforms → bell-ish). Used to spread
// votes realistically around a contestant's "true" appeal.
export function gaussian(mean = 0, stdev = 1) {
  const u = (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
  return mean + u * 2 * stdev;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Quantize to 0.1 in [1,10] — mirrors src/lib/utils.js normalizeScore.
export const quantizeScore = (v) => clamp(Math.round(v * 10) / 10, 1, 10);

// ── Bounded-concurrency runner ──────────────────────────────────────────────
// Runs `fn` over `items` with at most `concurrency` in flight at once. This is
// how we simulate "N users hitting the DB at the same time": each item is one
// user's action, and a window of them race for the same episode/contestant rows
// and atomic counters. Returns results in input order; failures become null and
// are logged (one slow/failed user must not abort the whole simulation).
export async function chunkedParallel(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = null;
        console.error(`  [task ${i}] ${err?.message || err}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export const CONCURRENCY = 40;

// Insert an array of rows in chunks (Supabase/Postgres parameter limits) and
// throw on the first error so seeding fails loudly rather than half-populating.
export async function insertChunked(table, rows, chunk = 500) {
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from(table).insert(slice);
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
}

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// ── Preflight ───────────────────────────────────────────────────────────────
// The simulation depends on a fully-migrated schema (through 0027). Rather than
// failing deep inside with a cryptic Postgres error, probe the pieces up front
// and tell the user exactly which migration to run. Returns { ok, hasOverallScore }.
export async function preflight() {
  const problems = [];

  // Columns added across the migration history that the sim writes/reads.
  const columnChecks = [
    ["User", "onboarded", "0027-user-bio-onboarding"],
    ["User", "bio", "0027-user-bio-onboarding"],
    ["User", "trust_score", "schema.sql"],
    ["User", "latent_points_season", "0020-sync-latent-pipeline"],
    ["Episode", "judge_ids", "0024-episode-judge-allocation"],
    ["ContestantEpisodeAppearance", "peoples_verdict_weighted", "0020-sync-latent-pipeline"],
  ];
  for (const [table, column, migration] of columnChecks) {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (error && /column .* does not exist|does not exist/i.test(error.message)) {
      problems.push(`  • ${table}.${column} missing — run migration ${migration}`);
    } else if (error && error.code === "42P01") {
      problems.push(`  • table ${table} missing — run the base schema.sql`);
    }
  }

  // Reveal RPCs. Probing with a zero UUID is harmless: score_episode_predictions
  // finds no episode and no-ops; both only run global UPDATEs that match nothing
  // on a fresh DB. A "function not found" (PGRST202) is the real failure.
  for (const rpc of ["score_episode_predictions", "award_episode_latent_points"]) {
    const { error } = await supabase.rpc(rpc, { p_episode_id: ZERO_UUID });
    if (error && (error.code === "PGRST202" || /could not find the function|does not exist/i.test(error.message))) {
      problems.push(`  • RPC ${rpc}() missing — run migrations 0016/0017/0020/0021`);
    }
  }

  // overall_score/tag are the legacy JudgeRating columns the judges-scoreboard
  // page still reads. Optional — we include them in inserts only if present.
  const { error: osErr } = await supabase.from("JudgeRating").select("overall_score").limit(1);
  const hasOverallScore = !(osErr && /does not exist/i.test(osErr.message));

  if (problems.length) {
    console.error("\n✖ Preflight failed — the target DB isn't fully migrated:\n");
    console.error(problems.join("\n"));
    console.error("\nApply the missing migrations in the Supabase SQL editor, then re-run.\n");
    return { ok: false, hasOverallScore };
  }
  return { ok: true, hasOverallScore };
}

// Confirm the human really means to touch THIS database. Used by clear-db.
export function announceTarget(action) {
  console.log(`\n${action} → Supabase project: \x1b[1m${PROJECT_REF}\x1b[0m (${SUPABASE_URL})\n`);
}
