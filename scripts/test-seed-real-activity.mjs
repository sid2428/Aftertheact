// Self-check for the seed's non-trivial logic: sentiment label → target, and
// that many votes for a target actually AVERAGE near that target (the whole
// point of "votes that add up to the sentiment"). No DB, no framework.
//
//   node scripts/test-seed-real-activity.mjs
import assert from "node:assert";
import { targetFromLabel, scoreFor } from "./seed-real-activity.mjs";

// 1) label mapping (the qualitative signal we actually use)
assert.strictEqual(targetFromLabel("Overwhelmingly Positive"), 9.1);
assert.strictEqual(targetFromLabel("Negative"), 3.2);
assert.strictEqual(targetFromLabel("Mixed"), 5.6);
assert.strictEqual(targetFromLabel("garbage", 6.5), 6.5); // unknown → fallback
assert.strictEqual(targetFromLabel(""), 6.5);             // empty → default

// 2) a crowd of balanced jurors averages within ~0.4 of the target, and stays in [1,10]
const balanced = { _persona: { bias: 0, troll: false, stan: false, activity: 1 } };
for (const target of [2.2, 5.6, 7.6, 9.1]) {
  let sum = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const s = scoreFor(balanced, target);
    assert.ok(s >= 1 && s <= 10, `score ${s} out of range`);
    sum += s;
  }
  const avg = sum / N;
  // clamping pulls extremes inward (2.2 floats up, 9.1 dips down), so allow 0.6.
  assert.ok(Math.abs(avg - target) < 0.6, `avg ${avg.toFixed(2)} too far from target ${target}`);
}

console.log("✓ all self-checks passed");
