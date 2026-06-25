export const ORACLE_SCORING = {
  POINTS_TOP: 50,
  POINTS_BOTTOM: 50,
  POINTS_ALIGNMENT: 100,
  PERFECT_MULTIPLIER: 2,
  MAX_BASE_PER_EPISODE: 200,
  ALIGNMENT_MARGIN: 1.5,
};

export const ORACLE_TIERS = [
  { name: "Initiate", threshold: 0 },
  { name: "Seer", threshold: 400 },
  { name: "Oracle", threshold: 1200 },
  { name: "Prophet", threshold: 3000 }
];
