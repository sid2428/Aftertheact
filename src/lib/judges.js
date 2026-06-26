// Aggregate JudgeRating rows into display stats. Each row carries a 1–10 `score`
// and the rater's `trust` (their User.trust_score). The headline `avgScore` is
// the TRUST-WEIGHTED mean — Σ(score·trust)/Σ(trust) — so every vote counts, but
// in proportion to platform trust. `stdDev` stays an unweighted spread; it only
// drives the "most controversial" badge.
export function aggregateRatings(rows = []) {
  const count = rows.length;
  if (count === 0) {
    return { count: 0, avgScore: 0, stdDev: 0 };
  }
  let weighted = 0, weight = 0;
  for (const r of rows) {
    const t = r.trust > 0 ? r.trust : 0;
    weighted += (r.score || 0) * t;
    weight += t;
  }
  // Fall back to equal weight if every rater's trust is 0/missing, so scores
  // never silently vanish to zero.
  const avgScore = weight > 0 ? weighted / weight : rows.reduce((s, r) => s + (r.score || 0), 0) / count;
  const variance = rows.reduce((s, r) => s + Math.pow((r.score || 0) - avgScore, 2), 0) / count;

  return {
    count,
    avgScore,
    stdDev: Math.sqrt(variance),
  };
}

export function validateRatingScore(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  return n;
}
