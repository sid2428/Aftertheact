// Aggregate a set of JudgeRating rows into display stats.
export function aggregateRatings(rows = []) {
  const count = rows.length;
  if (count === 0) {
    return { count: 0, avgHarshness: 0, avgAccuracy: 0, avgEntertainment: 0, harshnessStdDev: 0 };
  }
  const mean = (key) => rows.reduce((s, r) => s + (r[key] || 0), 0) / count;
  const avgHarshness = mean("harshness_score");
  const avgAccuracy = mean("accuracy_score");
  const avgEntertainment = mean("entertainment_score");
  const variance = rows.reduce((s, r) => s + Math.pow((r.harshness_score || 0) - avgHarshness, 2), 0) / count;

  return {
    count,
    avgHarshness,
    avgAccuracy,
    avgEntertainment,
    harshnessStdDev: Math.sqrt(variance),
  };
}

export function validateRatingScore(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  return n;
}
