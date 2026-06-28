// Seed the REAL India's Got Latent Season 1 from the `seed/` folder.
//
//   node scripts/clear-db.mjs --yes      # wipe first (recommended)
//   node scripts/seed-s1-real.mjs        # then seed
//
// Data-only (no simulated crowd votes — peoples_verdict/latent_score stay null
// until real users vote). Reads:
//   • seed/IGL_scores_episodewise.csv          → self_score + judge_average
//   • seed/assets/Contestants/epN/_contestants.txt → canonical contestant names
//   • seed/assets/Contestants/epN/<name>.jpg   → contestant photos
//   • seed/Judges.csv                          → per-episode judge lineup
//   • seed/assets/Judges/<name>.<ext>          → judge photos
//
// Photos are copied straight into public/uploads/{contestants,judges}/ and the
// path is stored on the row. ponytail: a plain file copy, not the app's sharp
// resize pipeline — these source images are already web-sized; add resize if a
// huge original ever shows up.
//
// Keeps the old fictional scripts (seed-data.mjs / simulate-igl.mjs) untouched;
// only reuses the shared infra in seed-common.mjs.

import { supabase, redis } from "./seed-common.mjs";
import { readFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEED = join(ROOT, "seed");
const UPLOADS = join(ROOT, "public", "uploads");
const EPISODES = 12;

// ── helpers ──────────────────────────────────────────────────────────────────
const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// First numeric token; treats "8,5" as 8.5 and strips trailing "(12:34)" notes.
function parseScore(s) {
  if (s == null) return null;
  const t = String(s).trim().replace(/(\d),(\d)/, "$1.$2");
  const m = t.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Minimal RFC-4180 CSV parser → array of rows (array of cells).
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

function copyPhoto(srcPath, subdir, slug) {
  const ext = extname(srcPath).toLowerCase();
  const destDir = join(UPLOADS, subdir);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(srcPath, join(destDir, `${slug}${ext}`));
  return `/uploads/${subdir}/${slug}${ext}`;
}

// ── parse contestant scores per episode (ordered, zipped with the txt names) ──
function parseScores() {
  const rows = parseCsv(readFileSync(join(SEED, "IGL_scores_episodewise.csv"), "utf8"));
  const byEp = {};
  let cur = null, skipHeader = false;
  for (const row of rows) {
    const first = (row[0] || "").trim();
    const em = first.match(/^Episode\s*(\d+)/i);
    if (em) { cur = +em[1]; byEp[cur] = []; skipHeader = true; continue; }
    if (cur == null) continue;
    if (skipHeader) { skipHeader = false; continue; }
    if (row.every((c) => !String(c).trim())) { cur = null; continue; }
    byEp[cur].push({ self: parseScore(row[1]), judge: parseScore(row[2]) });
  }
  return byEp;
}

// ── parse judges per episode + a global registry (name → descriptor/photo) ────
const PHOTO_ALIAS = {
  "Rahgir Live": "Rahgir",
  Yashraj: "Yashraj Mukhate",
  "Nishant Tanwar / Joke Singh": "Nishant Tanwar",
  "GamerFleet / Anshu Bisht": "GamerFleet",
  "Agu Stanley Chiedozie / Istanboss": "Istanboss (Agu Stanley)",
};
const HERO = new Set(["Samay Raina", "Balraj Singh Ghai"]); // recurring core panel

function parseJudges(photoByBase) {
  const rows = parseCsv(readFileSync(join(SEED, "Judges.csv"), "utf8"));
  const registry = new Map();   // name → { descriptor, photoKey }
  const perEpisode = {};        // ep → [slug, …]
  for (let ep = 1; ep <= EPISODES; ep++) perEpisode[ep] = [];

  for (const row of rows.slice(1)) {            // skip the "Episode,1,2,…" header
    for (let ep = 1; ep <= EPISODES; ep++) {
      const raw = (row[ep] || "").trim();
      if (!raw) continue;
      const m = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
      const name = (m ? m[1] : raw).trim();
      const descriptor = m ? m[2].trim() : "";
      if (!name) continue;
      if (!registry.has(name)) {
        const photoKey = PHOTO_ALIAS[name] || name;
        registry.set(name, { descriptor, photoKey: photoByBase.has(photoKey) ? photoKey : null });
      }
      const slug = slugify(name);
      // Judges.csv columns run in reverse episode order: column 1 is episode 12,
      // column 12 is episode 1 (contestant files were already in correct order).
      const realEp = EPISODES + 1 - ep;
      if (!perEpisode[realEp].includes(slug)) perEpisode[realEp].push(slug);
    }
  }
  return { registry, perEpisode };
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!redis) {
    console.error("Redis not configured — judges live in the Redis panel pool. Aborting.");
    process.exit(1);
  }

  // existing-data guard
  const { count } = await supabase.from("Episode").select("id", { count: "exact", head: true });
  if (count) {
    console.error(`✖ ${count} episodes already exist. Run \`node scripts/clear-db.mjs --yes\` first.`);
    process.exit(1);
  }

  const judgeFiles = readdirSync(join(SEED, "assets", "Judges")).filter((f) =>
    /\.(jpe?g|png|webp)$/i.test(f)
  );
  const photoByBase = new Map(judgeFiles.map((f) => [basename(f, extname(f)), join(SEED, "assets", "Judges", f)]));

  const scores = parseScores();
  const { registry, perEpisode } = parseJudges(photoByBase);

  // 1) Episodes ────────────────────────────────────────────────────────────────
  const baseAir = Date.parse("2024-06-08T20:00:00+05:30");
  const episodeRows = Array.from({ length: EPISODES }, (_, i) => {
    const air = baseAir + i * 7 * 86_400_000;
    return {
      season_number: 1,
      episode_number: i + 1,
      title: `Episode ${i + 1}`,
      air_date: new Date(air).toISOString(),
      voting_window_open: new Date(air).toISOString(),
      voting_window_close: new Date(air + 48 * 3_600_000).toISOString(),
      status: "REVEALED",
      is_revelation_triggered: true,
    };
  });
  const { data: episodes, error: epErr } = await supabase.from("Episode").insert(episodeRows).select("id, episode_number");
  if (epErr) throw new Error(`insert Episode: ${epErr.message}`);
  const epIdByNum = new Map(episodes.map((e) => [e.episode_number, e.id]));
  console.log(`✓ ${episodes.length} episodes`);

  // 2) Contestants + appearances ────────────────────────────────────────────────
  let contestantTotal = 0, contestantPhotos = 0;
  for (let ep = 1; ep <= EPISODES; ep++) {
    const dir = join(SEED, "assets", "Contestants", `ep${ep}`);
    const names = readFileSync(join(dir, "_contestants.txt"), "utf8")
      .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const epScores = scores[ep] || [];
    if (epScores.length !== names.length) {
      console.warn(`  ! ep${ep}: ${names.length} names vs ${epScores.length} score rows — zipping by index`);
    }

    const contestantRows = names.map((name, idx) => {
      const slug = `${slugify(name)}-s1e${ep}`;
      const photo = join(dir, `${name}.jpg`);
      let image_url = null;
      if (existsSync(photo)) { image_url = copyPhoto(photo, "contestants", slug); contestantPhotos++; }
      return { name, slug, image_url };
    });
    const { data: inserted, error: cErr } = await supabase.from("Contestant").insert(contestantRows).select("id, slug");
    if (cErr) throw new Error(`insert Contestant ep${ep}: ${cErr.message}`);
    const idBySlug = new Map(inserted.map((c) => [c.slug, c.id]));

    const appearanceRows = names.map((name, idx) => ({
      contestant_id: idBySlug.get(`${slugify(name)}-s1e${ep}`),
      episode_id: epIdByNum.get(ep),
      self_score: epScores[idx]?.self ?? null,
      judge_average: epScores[idx]?.judge ?? null,
    }));
    const { error: aErr } = await supabase.from("ContestantEpisodeAppearance").insert(appearanceRows);
    if (aErr) throw new Error(`insert appearances ep${ep}: ${aErr.message}`);
    contestantTotal += names.length;
  }
  console.log(`✓ ${contestantTotal} contestants (${contestantPhotos} with photos)`);

  // 3) Judge panel pool (Redis) + photos ────────────────────────────────────────
  const members = [];
  const usedPhotoKeys = new Set();
  let judgePhotos = 0;
  for (const [name, { descriptor, photoKey }] of registry) {
    const slug = slugify(name);
    let image = "";
    if (photoKey) {
      image = copyPhoto(photoByBase.get(photoKey), "judges", slug);
      usedPhotoKeys.add(photoKey);
      judgePhotos++;
    }
    members.push({
      id: slug, name, image, descriptor,
      instagram_handle: "", bio: "", tags: [], show_in_hero: HERO.has(name),
    });
  }
  // Any seed photo not tied to an S1 episode → still upload it as an unallocated member.
  for (const base of photoByBase.keys()) {
    if (usedPhotoKeys.has(base)) continue;
    const slug = slugify(base);
    if (members.some((m) => m.id === slug)) continue;
    members.push({
      id: slug, name: base, image: copyPhoto(photoByBase.get(base), "judges", slug),
      descriptor: "", instagram_handle: "", bio: "", tags: [], show_in_hero: false,
    });
    judgePhotos++;
  }
  await redis.set("panel:members", members);
  console.log(`✓ ${members.length} judges in panel pool (${judgePhotos} with photos)`);

  // 4) Per-episode judge allocation ─────────────────────────────────────────────
  for (let ep = 1; ep <= EPISODES; ep++) {
    const { error } = await supabase.from("Episode").update({ judge_ids: perEpisode[ep] }).eq("id", epIdByNum.get(ep));
    if (error) throw new Error(`update judge_ids ep${ep}: ${error.message}`);
  }
  console.log("✓ judge_ids allocated per episode");
  console.log("\nDone. Season 1 seeded (data-only, no crowd votes).");
  process.exit(0);
}

main().catch((err) => { console.error("\n✖ seed failed:", err.message); process.exit(1); });
