// Wipe ALL application data from the target Supabase project + the Redis keys the
// app uses, so simulate-igl.mjs can repopulate a clean slate.
//
//   node scripts/clear-db.mjs --yes
//
// Guarded by --yes on purpose: even a throwaway dev DB shouldn't be nuked by a
// stray run. It prints which project it's about to clear BEFORE doing anything.
//
// NOT for production. It deletes every row in every table below.

import {
  supabase,
  redis,
  announceTarget,
  chunkedParallel,
} from "./seed-common.mjs";

// Child → parent order. FK cascades would handle most of this, but deleting
// explicitly (and in order) gives clear per-table counts and avoids surprises if
// a cascade is ever changed.
const TABLES = [
  "LatentPointsLedger",
  "ModerationLog",
  "RoastUpvote",
  "Roast",
  "CommunityPostLike",
  "CommunityPostReply",
  "PostReport",
  "CommunityPost",
  "JudgeRating",
  "UserVote",
  "UserPrediction",
  "ContestantEpisodeAppearance",
  "Contestant",
  "Episode",
  "User",
];

async function tableCount(table) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
  return count ?? 0;
}

async function clearTable(table) {
  const before = await tableCount(table);
  if (before === 0) return { table, deleted: 0, missing: false };
  // Match every row: `id IS NOT NULL` is always true (id is the PK).
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) {
    // 42P01 = table doesn't exist (un-migrated DB) — report, don't abort.
    if (error.code === "42P01") return { table, deleted: 0, missing: true };
    throw new Error(`clear ${table}: ${error.message}`);
  }
  return { table, deleted: before, missing: false };
}

async function clearRedis() {
  if (!redis) {
    console.log("  (Redis not configured — skipped)");
    return;
  }
  // App keys: live vote hashes, per-user vote/voted markers, the judge panel
  // pool, OTPs, and community rate-limit counters. SCAN so we never block Redis.
  const patterns = [
    "episode:*",
    "vote:*",
    "panel:members",
    "otp:*",
    "community:*",
  ];
  let total = 0;
  for (const pattern of patterns) {
    let cursor = "0";
    const keys = [];
    do {
      const [next, batch] = await redis.scan(cursor, { match: pattern, count: 500 });
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");
    if (keys.length) {
      // Delete in chunks to stay under request-size limits.
      await chunkedParallel(chunk(keys, 200), 8, (group) => redis.del(...group));
      total += keys.length;
    }
  }
  console.log(`  Redis keys deleted: ${total}`);
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

async function main() {
  if (!process.argv.includes("--yes")) {
    announceTarget("WOULD CLEAR");
    console.log("Refusing to wipe without confirmation. Re-run with --yes to proceed:\n");
    console.log("  node scripts/clear-db.mjs --yes\n");
    process.exit(1);
  }

  announceTarget("CLEARING");

  console.log("Deleting Postgres rows…");
  for (const table of TABLES) {
    const { deleted, missing } = await clearTable(table);
    console.log(`  ${table.padEnd(30)} ${missing ? "(missing — skipped)" : `${deleted} rows`}`);
  }

  console.log("\nClearing Redis…");
  await clearRedis();

  console.log("\n✓ Database cleared. Run `node scripts/simulate-igl.mjs` to repopulate.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✖ clear-db failed:", err.message);
  process.exit(1);
});
