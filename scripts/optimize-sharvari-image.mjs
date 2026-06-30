#!/usr/bin/env node
import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { saveUploadedImage } from "../src/lib/uploadImage.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── .env loader ─────────────────────────────────────────────
const envPath = join(REPO_ROOT, ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const seedFile = join(REPO_ROOT, "seed", "sharvari-wagh.webp");
  if (!existsSync(seedFile)) {
    console.error(`Seed file not found: ${seedFile}`);
    process.exit(1);
  }

  console.log("1. Processing & optimizing Sharvari's seed image...");
  const buffer = readFileSync(seedFile);
  const file = new File([buffer], "sharvari-wagh.webp", { type: "image/webp" });
  
  // Save using the official uploadImage pipeline (sharp compression, EXIF stripping, UUID)
  const newUrl = await saveUploadedImage(file, "judges");
  console.log(`Optimized image saved locally at: ${newUrl}`);

  console.log("2. Fetching panel members from Redis...");
  const members = await redis.get("panel:members");
  if (!Array.isArray(members)) {
    console.error("Redis panel:members is not an array!");
    process.exit(1);
  }

  const sharvariIdx = members.findIndex(m => m.id === "sharvari" || m.name.toLowerCase().includes("sharvari"));
  if (sharvariIdx === -1) {
    console.error("Sharvari not found in Redis panel:members.");
    process.exit(1);
  }

  const oldUrl = members[sharvariIdx].image;
  console.log(`Current image URL in Redis: ${oldUrl}`);

  members[sharvariIdx].image = newUrl;
  console.log("Updating Redis panel:members...");
  await redis.set("panel:members", members);
  console.log("Redis updated successfully!");

  // If the old image was a Supabase storage URL, let's delete it.
  // Example: https://rhsduyjcenfokkkqviwf.supabase.co/storage/v1/object/public/uploads/judges/90224b9b-57f9-47dc-97b6-b25d158de1ab.png
  if (oldUrl && oldUrl.includes("supabase.co")) {
    console.log("3. Deleting old image from Supabase storage...");
    // extract path: public/uploads/judges/90224b9b-57f9-47dc-97b6-b25d158de1ab.png -> bucket: uploads, path: judges/...
    const match = oldUrl.match(/\/storage\/v1\/object\/public\/uploads\/(.*)$/);
    const pathInBucket = match ? match[1] : null;
    if (pathInBucket) {
      console.log(`Deleting path from 'uploads' bucket: ${pathInBucket}`);
      const { data, error } = await supabase.storage.from("uploads").remove([pathInBucket]);
      if (error) {
        console.error("Error deleting from Supabase storage:", error.message);
      } else {
        console.log("Successfully deleted old Supabase storage image:", data);
      }
    } else {
      console.warn("Could not extract Supabase storage path from old URL:", oldUrl);
    }
  } else {
    // If the old URL was already localized but not using saveUploadedImage (e.g. from the reset commit)
    // we can still delete the hardcoded supabase image we found earlier: judges/90224b9b-57f9-47dc-97b6-b25d158de1ab.png
    console.log("Old URL was not a Supabase URL, checking for hardcoded Supabase storage image...");
    const hardcodedPath = "judges/90224b9b-57f9-47dc-97b6-b25d158de1ab.png";
    console.log(`Deleting default test asset: ${hardcodedPath}`);
    const { data, error } = await supabase.storage.from("uploads").remove([hardcodedPath]);
    if (error) {
      console.error("Error deleting from Supabase storage:", error.message);
    } else {
      console.log("Successfully deleted old Supabase storage image:", data);
    }
  }

  console.log("\nMigration completed successfully!");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
