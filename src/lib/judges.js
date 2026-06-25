// Aggregate a set of JudgeRating rows into display stats. Each row carries a
// single 1–10 `score`; we surface its mean plus the spread (std dev) used to
// flag the most divisive judge.
export function aggregateRatings(rows = []) {
  const count = rows.length;
  if (count === 0) {
    return { count: 0, avgScore: 0, stdDev: 0 };
  }
  const avgScore = rows.reduce((s, r) => s + (r.score || 0), 0) / count;
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
