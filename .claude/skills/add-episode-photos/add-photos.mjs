#!/usr/bin/env node
// Add contestant photos to an ALREADY-CREATED episode from a seed folder.
//
//   node .claude/skills/add-episode-photos/add-photos.mjs S02E01 [seedDir] [--dry]
//
// - Parses season/episode from the first arg (S02E01, s2e1, 2x1 all work).
// - Looks up the episode + its contestants in Supabase (via the repo .env).
// - Matches each image file in the seed folder to a contestant by name.
// - Copies it to public/uploads/contestants/<contestant-slug><ext> and sets
//   Contestant.image_url = /uploads/<...>  (LOCAL file storage, not object storage).
//
// Add `--dry` to preview the mapping without writing anything.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// ── tiny .env loader (same format as scripts/seed-common.mjs) ───────────────
for (const line of readFileSync(join(REPO_ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const positional = args.filter((a) => !a.startsWith("--"));
const token = positional[0];
if (!token) {
  console.error("Usage: node add-photos.mjs S02E01 [seedDir] [--dry]");
  process.exit(1);
}
const em = token.match(/s?0*(\d+)\s*[ex×]\s*0*(\d+)/i);
if (!em) {
  console.error(`Could not parse season/episode from "${token}" (try S02E01).`);
  process.exit(1);
}
const season = Number(em[1]);
const episode = Number(em[2]);
const seedDir = positional[1]
  ? join(REPO_ROOT, positional[1])
  : (existsSync(join(REPO_ROOT, "seed", token)) ? join(REPO_ROOT, "seed", token)
     : join(REPO_ROOT, "seed", `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`));

// ── helpers ───────────────────────────────────────────────────────────────
const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
// strip a trailing numeric/random suffix (the DB slug "avinash-agarwal-46586")
const nameBase = (slug) => slug.replace(/-\d+$/, "");
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// ── load episode + contestants ──────────────────────────────────────────────
const { data: ep, error: epErr } = await sb
  .from("Episode").select("id,title,status")
  .eq("season_number", season).eq("episode_number", episode).single();
if (epErr || !ep) {
  console.error(`No episode S${season}E${episode} found in DB. Create it first.`, epErr?.message || "");
  process.exit(1);
}
const { data: apps } = await sb
  .from("ContestantEpisodeAppearance")
  .select("Contestant(id,name,slug,image_url)").eq("episode_id", ep.id);
const contestants = (apps || []).map((a) => a.Contestant).filter(Boolean);
if (!contestants.length) {
  console.error(`Episode S${season}E${episode} has no contestants linked. Add them first.`);
  process.exit(1);
}

if (!existsSync(seedDir)) {
  console.error(`Seed folder not found: ${seedDir}`);
  process.exit(1);
}
const files = readdirSync(seedDir).filter((f) => IMG_EXT.has(extname(f).toLowerCase()));

console.log(`Episode S${season}E${episode} "${ep.title}" [${ep.status}] — ${contestants.length} contestants, ${files.length} images in ${seedDir}\n`);

// ── match each file to its best contestant (exact/prefix, then fuzzy) ────────
const used = new Set();
const plan = [];        // { file, contestant, how }
const unmatched = [];
for (const file of files) {
  const stem = slugify(file.replace(extname(file), ""));
  let best = null, bestHow = "", bestDist = Infinity;
  for (const c of contestants) {
    if (used.has(c.id)) continue;
    const base = nameBase(c.slug);
    if (stem === base) { best = c; bestHow = "exact"; bestDist = 0; break; }
    if (base.startsWith(stem) || stem.startsWith(base)) { if (1 < bestDist) { best = c; bestHow = "prefix"; bestDist = 1; } continue; }
    const d = lev(stem, base);
    if (d < bestDist) { best = c; bestHow = `fuzzy(${d})`; bestDist = d; }
  }
  // accept fuzzy only within a small edit distance (handles typos like sukurut/sukrut)
  if (best && (bestDist <= 2 || bestHow === "exact" || bestHow === "prefix")) {
    used.add(best.id);
    plan.push({ file, contestant: best, how: bestHow });
  } else {
    unmatched.push(file);
  }
}

// ── report ──────────────────────────────────────────────────────────────────
for (const p of plan) console.log(`  MATCH  ${p.file}  ->  ${p.contestant.name}  (${p.how})`);
for (const f of unmatched) console.log(`  ??     ${f}  ->  no confident match — rename it to the contestant's name`);
const noPhoto = contestants.filter((c) => !used.has(c.id));
for (const c of noPhoto) console.log(`  ----   (no file for ${c.name})`);
console.log("");

if (dry) { console.log("--dry: nothing written."); process.exit(0); }
if (!plan.length) { console.log("Nothing to do."); process.exit(0); }

// ── apply: copy file -> public/uploads/contestants/<slug><ext>, set image_url ─
const destDir = join(REPO_ROOT, "public", "uploads", "contestants");
mkdirSync(destDir, { recursive: true });
let ok = 0;
for (const { file, contestant } of plan) {
  const ext = extname(file).toLowerCase();
  const destName = `${contestant.slug}${ext}`;
  copyFileSync(join(seedDir, file), join(destDir, destName));
  const image_url = `/uploads/contestants/${destName}`;
  const { error } = await sb.from("Contestant").update({ image_url }).eq("id", contestant.id);
  if (error) console.log(`  FAIL ${contestant.name}: ${error.message}`);
  else { console.log(`  OK   ${contestant.name}: ${image_url}`); ok++; }
}
console.log(`\nDone: ${ok}/${plan.length} updated. Commit public/uploads/contestants/ so the files deploy.`);
if (unmatched.length) console.log(`Still unmatched: ${unmatched.join(", ")} — rename and re-run.`);
