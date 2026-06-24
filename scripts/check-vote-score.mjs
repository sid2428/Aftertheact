// Smallest check that fails if the 1–10 / 0.1 vote-score rule breaks.
// Run: node scripts/check-vote-score.mjs
import assert from "node:assert";
import { normalizeScore, SCORE_MIN, SCORE_MAX } from "../src/lib/utils.js";

assert.equal(normalizeScore(5), 5);
assert.equal(normalizeScore("8.5"), 8.5);
assert.equal(normalizeScore(8.54), 8.5); // quantize to 0.1
assert.equal(normalizeScore(SCORE_MIN), 1);
assert.equal(normalizeScore(SCORE_MAX), 10);
assert.equal(normalizeScore(0.9), null); // below min
assert.equal(normalizeScore(10.1), null); // above max
assert.equal(normalizeScore("abc"), null);
assert.equal(normalizeScore(Infinity), null);
assert.equal(normalizeScore(NaN), null);

console.log("vote-score checks passed");
