// Aggregate a set of JudgeRating rows into display stats.
export function aggregateRatings(rows = []) {
  const count = rows.length;
  if (count === 0) {
    return { count: 0, avgOverall: 0, overallStdDev: 0, topTag: null, tagCounts: {} };
  }
  const avgOverall = rows.reduce((s, r) => s + (r.overall_score || 0), 0) / count;
  const variance = rows.reduce((s, r) => s + Math.pow((r.overall_score || 0) - avgOverall, 2), 0) / count;

  const tagCounts = {};
  for (const r of rows) {
    if (r.tag) tagCounts[r.tag] = (tagCounts[r.tag] || 0) + 1;
  }
  const topTag = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0] || null;

  return {
    count,
    avgOverall,
    overallStdDev: Math.sqrt(variance),
    topTag,
    tagCounts,
  };
}

export function validateRatingScore(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  return n;
}
